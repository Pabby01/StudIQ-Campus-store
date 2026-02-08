/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyTransaction, verifySplTransferTransaction } from "@/lib/solana";
import { getPlatformFee, calculateFees, recordPlatformFee } from "@/lib/platformFees";
import { triggerNotification } from "@/lib/notifications";
import { POINTS } from "@/lib/constants";
import { SOLANA_CONFIG } from "@/lib/solana-config";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;
        // Accept both 'signature' and 'txSignature' field names
        const txSignature = body.signature || body.txSignature;

        if (!orderId || !txSignature) {
            return Response.json(
                { ok: false, error: "Order ID and transaction signature required" },
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

        // Platform wallet receives all payments
        const platformWallet = SOLANA_CONFIG.platformWallet;

        let expectedSolAmount = order.amount;

        // If currency is USD, calculate expected SOL amount
        // If currency is not SOL, calculate expected SOL amount
        if (order.currency !== "SOL") {
            let solPrice = null;

            try {
                // Fetch SOL price from CoinGecko
                const cgRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
                    headers: { 'Accept': 'application/json', 'User-Agent': 'CampusStore/1.0' },
                    next: { revalidate: 60 } // Cache for 1 minute
                });

                if (cgRes.ok) {
                    const data = await cgRes.json();
                    solPrice = Number(data.solana?.usd);
                }
            } catch (e) {
                console.warn("[Verify] Price fetch failed:", e);
            }

            if (solPrice && !isNaN(solPrice)) {
                // Allow a slightly wider margin for error (5%) due to potential rate differences
                // between checkout time and verification time.
                expectedSolAmount = order.amount / solPrice;
            } else {
                console.error("[Verify] Failed to fetch price from all sources");
                return Response.json(
                    { ok: false, error: "Unable to verify currency conversion rate. Please contact support." },
                    { status: 500 }
                );
            }
        }

        // Use tighter tolerance for native SOL (0.1%) and slightly more for USD conversions (2%)
        const tolerance = order.currency === "SOL" ? 0.001 : 0.02;

        const verification = order.currency === "SOL"
            ? await verifyTransaction(
                txSignature,
                order.buyer_address,
                platformWallet,
                expectedSolAmount,
                tolerance
            )
            : await verifySplTransferTransaction(
                txSignature,
                order.buyer_address,
                platformWallet,
                SOLANA_CONFIG.usdcMint,
                order.amount,
                tolerance
            );

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
                { ok: false, error: verification.error || "Transaction verification failed" },
                { status: 400 }
            );
        }

        // Get seller's platform fee percentage
        const sellerAddress = (order.stores as any).owner_address;
        const feePercentage = await getPlatformFee(sellerAddress);

        // Calculate platform fee and seller payout
        const { feeAmount, sellerPayout } = calculateFees(order.amount, feePercentage);

        // Determine seller's plan name
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
                tx_signature: txSignature,
                seller_payout: sellerPayout,
                platform_fee: feeAmount,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

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
                feeCurrency: order.currency || 'SOL',
                orderAmount: order.amount,
                sellerPayout
            });
        } catch (feeError) {
            console.error("Failed to record platform fee:", feeError);
            // Don't fail the order, just log the error
        }

        // Check if this is the first purchase for bonus
        const { count: purchaseCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("buyer_address", order.buyer_address)
            .neq("status", "failed");

        const isFirstPurchase = purchaseCount === 1;

        // Award points to buyer (5% of purchase)
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

        // Award points to seller for completing order
        await supabase.from("points_log").insert({
            address: (order.stores as any).owner_address,
            points: POINTS.ORDER_COMPLETED,
            reason: `Order completed: ${orderId}`,
        });

        // Check seller milestones (10, 50, 100 orders)
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

        // Send Email Notifications (Success)
        try {
            const { sendOrderConfirmation, sendSellerNotification } = await import('@/lib/email');

            // Fetch full order details including items
            const { data: fullOrder } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*)), stores(name, owner_address)')
                .eq('id', orderId)
                .single();

            if (fullOrder) {
                const buyerEmail = fullOrder.buyer_email; // We stored this in create
                const store = fullOrder.stores;

                // Get seller email
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

                if (buyerEmail) {
                    sendOrderConfirmation(orderDetails).catch(console.error);
                }

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
            txSignature,
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
