import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminAddress = searchParams.get("admin");
        const sort = searchParams.get("sort") || "joined";
        const limit = parseInt(searchParams.get("limit") || "50");

        // Verify admin access
        requireAdmin(adminAddress);

        const supabase = getSupabaseServerClient();

        // Get users with their order stats
        const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .limit(limit);

        // Enrich with order statistics
        const enrichedUsers = await Promise.all(
            (profiles || []).map(async (profile) => {
                // Get order stats as buyer
                const { data: buyerOrders } = await supabase
                    .from("orders")
                    .select("amount, currency")
                    .eq("buyer_address", profile.address);

                const totalSpent = buyerOrders?.reduce((sum, order) => {
                    return sum + (parseFloat(order.amount.toString()) || 0);
                }, 0) || 0;

                // Get store stats as seller
                const { data: stores } = await supabase
                    .from("stores")
                    .select("id")
                    .eq("owner_address", profile.address);

                let totalRevenue = 0;
                if (stores && stores.length > 0) {
                    const storeIds = stores.map(s => s.id);
                    const { data: sellerOrders } = await supabase
                        .from("orders")
                        .select("amount")
                        .in("store_id", storeIds)
                        .eq("status", "completed");

                    totalRevenue = sellerOrders?.reduce((sum, order) => {
                        return sum + (parseFloat(order.amount.toString()) || 0);
                    }, 0) || 0;
                }

                return {
                    address: profile.address,
                    name: profile.name || "Unknown",
                    email: profile.email || "",
                    school: profile.school,
                    campus: profile.campus,
                    points: profile.points || 0,
                    totalSpent,
                    totalRevenue,
                    storeCount: stores?.length || 0,
                    joinedAt: profile.created_at,
                };
            })
        );

        // Sort users
        enrichedUsers.sort((a, b) => {
            if (sort === "revenue") return b.totalRevenue - a.totalRevenue;
            if (sort === "spent") return b.totalSpent - a.totalSpent;
            if (sort === "points") return b.points - a.points;
            return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        });

        return Response.json({
            ok: true,
            users: enrichedUsers,
        });
    } catch (error: any) {
        console.error("[Admin Users] Error:", error);

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
