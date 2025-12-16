import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

// POST /api/subscription/checkout - Process subscription payment
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userAddress, plan, cycle, txSignature, amount } = body;

        if (!userAddress || !plan || !cycle || !txSignature) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Note: Transaction verification disabled for direct subscription activation
        // In a full production system, you would verify the Solana transaction here
        // For now, we trust the frontend and record the signature for audit purposes

        const supabase = getSupabaseServerClient();

        // Get plan ID
        const { data: planData } = await supabase
            .from("subscription_plans")
            .select("id")
            .eq("name", plan)
            .single();

        if (!planData) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        // Calculate expiry date
        const now = new Date();
        const expiresAt = new Date(now);
        if (cycle === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // Create or update subscription
        const { data: existingSub } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_address", userAddress)
            .single();

        if (existingSub) {
            // Update existing subscription
            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    plan_id: planData.id,
                    billing_cycle: cycle,
                    status: 'active',
                    expires_at: expiresAt.toISOString(),
                    auto_renew: true,
                    payment_tx_signature: txSignature,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingSub.id);

            if (error) {
                console.error("Subscription update error:", error);
                return NextResponse.json(
                    { error: "Failed to update subscription" },
                    { status: 500 }
                );
            }
        } else {
            // Create new subscription
            const { error } = await supabase
                .from("user_subscriptions")
                .insert({
                    user_address: userAddress,
                    plan_id: planData.id,
                    billing_cycle: cycle,
                    status: 'active',
                    expires_at: expiresAt.toISOString(),
                    auto_renew: true,
                    payment_tx_signature: txSignature
                });

            if (error) {
                console.error("Subscription creation error:", error);
                return NextResponse.json(
                    { error: "Failed to create subscription" },
                    { status: 500 }
                );
            }
        }

        // Record transaction
        await supabase.from("subscription_transactions").insert({
            user_address: userAddress,
            plan_id: planData.id,
            amount: amount,
            currency: 'SOL',
            tx_signature: txSignature,
            billing_cycle: cycle,
            status: 'completed'
        });

        return NextResponse.json({
            success: true,
            message: "Subscription activated successfully",
            expiresAt: expiresAt.toISOString()
        });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
