import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST /api/subscription/cancel - Cancel user's subscription
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userAddress } = body;

        if (!userAddress) {
            return NextResponse.json(
                { error: "User address required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Find active subscription
        const { data: subscription, error: findError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_address", userAddress)
            .eq("status", "active")
            .maybeSingle();

        if (findError) {
            console.error("Find subscription error:", findError);
            return NextResponse.json(
                { error: "Failed to find subscription" },
                { status: 500 }
            );
        }

        if (!subscription) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            );
        }

        // Cancel subscription (but keep active until expiry)
        const { error: cancelError } = await supabase
            .from("user_subscriptions")
            .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                auto_renew: false
            })
            .eq("id", subscription.id);

        if (cancelError) {
            console.error("Cancel subscription error:", cancelError);
            return NextResponse.json(
                { error: "Failed to cancel subscription" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Subscription cancelled. You'll retain premium features until the end of your billing period.",
            expiresAt: subscription.expires_at
        });
    } catch (error) {
        console.error("Cancel error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
