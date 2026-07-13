import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getPlatformFee, calculateFees, recordPlatformFee } from "@/lib/platformFees";
import { triggerNotification } from "@/lib/notifications";
import { POINTS } from "@/lib/constants";
import { createZendClient } from "pay-with-zend-sdk";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, zend_return_token } = body;

        if (!orderId || !zend_return_token) {
            return Response.json(
                { ok: false, error: "Order ID and Zend return token required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Fetch the order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, stores(owner_address)")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error("Order fetch error:", orderError);
            return Response.json(
                { ok: false, error: "Order not found" },
                { status: 404 }
            );
        }
        
        const paymentRequestId = order.tx_sig;
        if (!paymentRequestId) {
            return Response.json(
                { ok: false, error: "Order is missing a payment request ID" },
                { status: 400 }
            );
        }

        const zendClient = createZendClient({
            apiKey: process.env.ZEND_API_KEY || "",
        });

        // Verify the return token
        const verification = await zendClient.verifyReturnToken({
            token: zend_return_token,
            paymentRequestId: paymentRequestId,
        });

        if (!verification.valid) {
            // Mark order as failed
            await supabase
                .from("orders")
                .update({
                    status: "failed",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            return Response.json(
                { ok: false, error: "Zend return token verification failed" },
                { status: 400 }
            );
        }

        // Token is valid, process the order
        const sellerAddress = (order.stores as any).owner_address;
        const feePercentage = await getPlatformFee(sellerAddress);
        const { feeAmount, sellerPayout } = calculateFees(order.amount, feePercentage);

        const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select("subscription_plans(name)")
            .eq("user_address", sellerAddress)
            .eq("status", "active")
            .maybeSingle();

        const sellerPlan = subscription?.subscription_plans
            ? (subscription.subscription_plans as any).name
            : 'free';

        // Mark order as processing and store seller payout
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "processing",
                seller_payout: sellerPayout,
                platform_fee: feeAmount,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("status", "pending"); // Only update if still pending to prevent double processing

        if (updateError) {
            console.error("Order update error:", updateError);
            return Response.json(
                { ok: false, error: "Failed to update order" },
                { status: 500 }
            );
        }

        // Record platform fee in database
        try {
            await recordPlatformFee({
                orderId,
                sellerAddress,
                sellerPlan,
                feePercentage,
                feeAmount,
                feeCurrency: order.currency || 'USD',
                orderAmount: order.amount,
                sellerPayout
            });
        } catch (feeError) {
            console.error("Failed to record platform fee:", feeError);
        }

        // Points tracking
        const { count: purchaseCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("buyer_address", order.buyer_address)
            .neq("status", "failed");

        const isFirstPurchase = purchaseCount === 1;
        const basePoints = Math.floor(order.amount * POINTS.PURCHASE_REWARD_PERCENT);
        const bonusPoints = isFirstPurchase ? POINTS.FIRST_PURCHASE : 0;
        const totalBuyerPoints = basePoints + bonusPoints;

        await supabase.from("points_log").insert({
            address: order.buyer_address,
            points: totalBuyerPoints,
            reason: isFirstPurchase
                ? `First purchase bonus + Purchase order ${orderId}`
                : `Purchase order ${orderId}`,
        });

        await supabase.from("points_log").insert({
            address: (order.stores as any).owner_address,
            points: POINTS.ORDER_COMPLETED,
            reason: `Order completed: ${orderId}`,
        });

        // Milestone points
        const { count: sellerOrderCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", order.store_id)
            .neq("status", "failed");

        let milestonePoints = 0;
        let milestoneReason = "";
        if (sellerOrderCount === 10) {
            milestonePoints = POINTS.MILESTONE_10_SALES;
            milestoneReason = "Reached 10 sales milestone!";
        } else if (sellerOrderCount === 50) {
            milestonePoints = POINTS.MILESTONE_50_SALES;
            milestoneReason = "Reached 50 sales milestone!";
        } else if (sellerOrderCount === 100) {
            milestonePoints = POINTS.MILESTONE_100_SALES;
            milestoneReason = "Reached 100 sales milestone!";
        }

        if (milestonePoints > 0) {
            await supabase.from("points_log").insert({
                address: (order.stores as any).owner_address,
                points: milestonePoints,
                reason: milestoneReason,
            });
        }

        // Notifications
        try {
            const { sendOrderConfirmation, sendSellerNotification } = await import('@/lib/email');

            const { data: fullOrder } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*)), stores(name, owner_address)')
                .eq('id', orderId)
                .single();

            if (fullOrder) {
                const buyerEmail = fullOrder.buyer_email;
                const store = fullOrder.stores;
                const { data: sellerProfile } = await supabase.from('profiles').select('email').eq('address', store?.owner_address).single();

                const productsList = fullOrder.order_items.map((i: any) => ({
                    name: i.products.name,
                    imageUrl: i.products.image_url,
                    price: i.price,
                    qty: i.qty
                }));

                const orderDetails = {
                    orderId: fullOrder.id,
                    buyerName: (fullOrder.delivery_info as any)?.name || 'Customer',
                    buyerEmail: buyerEmail,
                    products: productsList,
                    total: fullOrder.amount,
                    currency: fullOrder.currency,
                    deliveryMethod: fullOrder.delivery_method,
                    deliveryAddress: fullOrder.delivery_method === 'shipping' ? {
                        name: (fullOrder.delivery_info as any)?.name || 'Customer',
                        address: (fullOrder.delivery_info as any)?.address || '',
                        city: (fullOrder.delivery_info as any)?.city || '',
                        zip: (fullOrder.delivery_info as any)?.zip || '',
                    } : undefined,
                };

                if (buyerEmail) sendOrderConfirmation(orderDetails).catch(console.error);
                if (sellerProfile?.email) {
                    sendSellerNotification({
                        ...orderDetails,
                        sellerEmail: sellerProfile.email,
                        storeName: store?.name || 'Store'
                    }).catch(console.error);
                }
            }
        } catch (e) {
            console.error("Email sending failed in verify:", e);
        }

        try {
            if (order.buyer_address) {
                await triggerNotification({
                    user_id: order.buyer_address,
                    title: 'Order Placed! 🛍️',
                    message: `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
                    type: 'success',
                    url: '/dashboard/purchases'
                });
            }
            if (sellerAddress) {
                await triggerNotification({
                    user_id: sellerAddress,
                    title: 'New Order Received! 💰',
                    message: `You have a new order #${order.id.slice(0, 8)} for ${order.currency} ${order.amount}.`,
                    type: 'success',
                    url: '/dashboard/sales'
                });
            }
        } catch (notifyError) {
            console.error('[Checkout] In-App Notification error:', notifyError);
        }

        return NextResponse.json({
            ok: true,
            orderId,
            pointsAwarded: totalBuyerPoints,
            firstPurchaseBonus: isFirstPurchase,
            sellerMilestone: milestonePoints > 0 ? milestoneReason : null,
        });
    } catch (error) {
        console.error("Transaction verification error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
