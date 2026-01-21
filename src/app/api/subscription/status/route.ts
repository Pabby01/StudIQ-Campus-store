import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";

// GET /api/subscription/status - Get user's subscription status
export async function GET(req: Request) {
    const address = await getSessionWallet(req);

    if (!address) {
        return NextResponse.json({ error: "Session required" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    try {

        if (!address) {
            // No profile found, return free plan
            const { data: freePlan } = await supabase
                .from("subscription_plans")
                .select("*")
                .eq("name", "free")
                .single();

            return NextResponse.json({
                plan: freePlan,
                status: "active",
                isFreeTier: true
            });
        }

        // Get active subscription
        const { data: subscription, error } = await supabase
            .from("user_subscriptions")
            .select(`
                *,
                subscription_plans (*)
            `)
            .eq("user_address", address)
            .eq("status", "active")
            .maybeSingle();

        if (error) {
            console.error("Error fetching subscription:", error);
            return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
        }

        // If no active subscription, return free plan
        if (!subscription) {
            const { data: freePlan } = await supabase
                .from("subscription_plans")
                .select("*")
                .eq("name", "free")
                .single();

            return NextResponse.json({
                plan: freePlan,
                status: "active",
                isFreeTier: true
            });
        }

        return NextResponse.json({
            subscription,
            plan: subscription.subscription_plans,
            status: subscription.status,
            expiresAt: subscription.expires_at,
            autoRenew: subscription.auto_renew
        });
    } catch (error) {
        console.error("Subscription status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
