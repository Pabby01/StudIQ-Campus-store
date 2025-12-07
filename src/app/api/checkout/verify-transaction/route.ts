import { verifyTransaction } from "@/lib/solana";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { orderId, txSignature } = await req.json();

        if (!orderId || !txSignature) {
            return Response.json(
                { ok: false, error: "Missing orderId or txSignature" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, stores(owner)")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return Response.json(
                { ok: false, error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.status !== "pending") {
            return Response.json(
                { ok: false, error: "Order already processed" },
                { status: 400 }
            );
        }

        // Verify transaction on Solana network
        const verification = await verifyTransaction(
            txSignature,
            order.buyer,
            order.stores.owner,
            order.total_amount
        );

        if (!verification.valid) {
            // Update order as failed
            await supabase
                .from("orders")
                .update({
                    status: "failed",
                    tx_signature: txSignature,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            return Response.json(
                { ok: false, error: verification.error || "Transaction verification failed" },
                { status: 400 }
            );
        }

        // Update order as completed
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "completed",
                tx_signature: txSignature,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Failed to update order:", updateError);
            return Response.json(
                { ok: false, error: "Failed to update order status" },
                { status: 500 }
            );
        }

        // Award points to buyer (5% of purchase)
        const pointsToAward = Math.floor(order.total_amount * 0.05);
        await supabase.from("point_logs").insert({
            address: order.buyer,
            points: pointsToAward,
            reason: `Purchase order ${orderId}`,
        });

        return NextResponse.json({
            ok: true,
            orderId,
            txSignature,
            pointsAwarded: pointsToAward,
        });
    } catch (error) {
        console.error("Transaction verification error:", error);
        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
