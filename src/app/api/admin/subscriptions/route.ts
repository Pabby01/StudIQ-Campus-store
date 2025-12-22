import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminAddress = searchParams.get("admin");

        // Verify admin access
        requireAdmin(adminAddress);

        const supabase = getSupabaseServerClient();

        // Get all subscriptions with user details
        const { data: subscriptions, error } = await supabase
            .from("user_subscriptions")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[Admin Subscriptions] Database error:", error);
            return Response.json(
                { ok: false, error: "Failed to fetch subscriptions" },
                { status: 500 }
            );
        }

        // Enrich with user and plan information
        const enrichedSubscriptions = await Promise.all(
            (subscriptions || []).map(async (sub) => {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, email")
                    .eq("address", sub.user_address)
                    .single();

                const { data: plan } = await supabase
                    .from("subscription_plans")
                    .select("name")
                    .eq("id", sub.plan_id)
                    .single();

                return {
                    id: sub.id,
                    userAddress: sub.user_address,
                    userName: profile?.name || "Unknown",
                    userEmail: profile?.email || "",
                    tier: plan?.name || "unknown",
                    status: sub.status,
                    startDate: sub.created_at,
                    endDate: sub.expires_at,
                    autoRenew: sub.auto_renew || false,
                    transactionHash: sub.payment_tx_signature,
                };
            })
        );

        // Calculate stats
        const activeSubscriptions = enrichedSubscriptions.filter(
            (s) => s.status === "active"
        ).length;

        const expiredSubscriptions = enrichedSubscriptions.filter(
            (s) => s.status === "expired"
        ).length;

        const premiumSubs = enrichedSubscriptions.filter(
            (s) => s.tier === "premium" && s.status === "active"
        ).length;

        const proPlusSubs = enrichedSubscriptions.filter(
            (s) => s.tier === "enterprise" && s.status === "active"
        ).length;

        return Response.json({
            ok: true,
            subscriptions: enrichedSubscriptions,
            stats: {
                total: enrichedSubscriptions.length,
                active: activeSubscriptions,
                expired: expiredSubscriptions,
                premium: premiumSubs,
                proPlus: proPlusSubs,
            },
        });
    } catch (error: any) {
        console.error("[Admin Subscriptions] Error:", error);

        if (error.message?.includes("Unauthorized")) {
            return Response.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
