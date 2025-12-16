import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/solana";
import { getPlatformFee, calculateFees, recordPlatformFee } from "@/lib/platformFees";

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
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js";

        // Verify transaction (buyer sends TO platform wallet)
        const verification = await verifyTransaction(
            txSignature,
            order.buyer_address,                   // FROM buyer
            platformWallet,                         // TO platform wallet
            order.amount
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
        const basePoints = Math.floor(order.amount * 0.05);
        const bonusPoints = isFirstPurchase ? 100 : 0;
        const totalBuyerPoints = basePoints + bonusPoints;

        await supabase.from("points_log").insert({
            address: order.buyer_address,
            points: totalBuyerPoints,
            reason: isFirstPurchase
                ? `First purchase bonus + Purchase order ${orderId}`
                : `Purchase order ${orderId}`,
        });

        // Award 10 points to seller for completing order
        await supabase.from("points_log").insert({
            address: (order.stores as any).owner_address,
            points: 10,
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
            milestonePoints = 50;
            milestoneReason = "Reached 10 sales milestone!";
        } else if (sellerOrderCount === 50) {
            milestonePoints = 100;
            milestoneReason = "Reached 50 sales milestone!";
        } else if (sellerOrderCount === 100) {
            milestonePoints = 500;
            milestoneReason = "Reached 100 sales milestone!";
        }

        if (milestonePoints > 0) {
            await supabase.from("points_log").insert({
                address: (order.stores as any).owner_address,
                points: milestonePoints,
                reason: milestoneReason,
            });
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
