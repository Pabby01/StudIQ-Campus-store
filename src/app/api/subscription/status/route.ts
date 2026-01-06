import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Helper to get user address from email if needed
async function resolveAddress(supabase: any, addressOrEmail: string): Promise<string | null> {
    if (addressOrEmail.startsWith("email:")) {
        const email = addressOrEmail.replace("email:", "");
        const { data: profile } = await supabase
            .from("profiles")
            .select("address")
            .eq("email", email)
            .maybeSingle();
        return profile?.address || null;
    }
    return addressOrEmail;
}

// GET /api/subscription/status?address=xxx - Get user's subscription status
// address can be a wallet address or "email:xxx" format
export async function GET(req: Request) {
    const url = new URL(req.url);
    const addressParam = url.searchParams.get("address");

    if (!addressParam) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    try {
        // Resolve email to address if needed
        const address = await resolveAddress(supabase, addressParam);

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
