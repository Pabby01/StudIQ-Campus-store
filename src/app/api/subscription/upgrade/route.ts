import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST /api/subscription/upgrade - Upgrade user's subscription
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userAddress, planId, txSignature, paymentMethod } = body;

        if (!userAddress || !planId || !txSignature) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Get the plan details
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 404 }
            );
        }

        // Calculate expiry date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Check for existing active subscription
        const { data: existing } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_address", userAddress)
            .eq("status", "active")
            .maybeSingle();

        if (existing) {
            // Cancel existing subscription
            await supabase
                .from("user_subscriptions")
                .update({
                    status: "cancelled",
                    cancelled_at: new Date().toISOString(),
                    auto_renew: false
                })
                .eq("id", existing.id);
        }

        // Create new subscription
        const { data: newSubscription, error: subError } = await supabase
            .from("user_subscriptions")
            .insert({
                user_address: userAddress,
                plan_id: planId,
                status: "active",
                expires_at: expiresAt.toISOString(),
                auto_renew: true,
                payment_method: paymentMethod || "sol",
                transaction_signature: txSignature
            })
            .select()
            .single();

        if (subError) {
            console.error("Subscription creation error:", subError);
            return NextResponse.json(
                { error: "Failed to create subscription" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            subscription: newSubscription,
            message: `Successfully upgraded to ${plan.display_name}!`
        });
    } catch (error) {
        console.error("Upgrade error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
