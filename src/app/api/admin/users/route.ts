/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
    try {
        const address = await getSessionWallet(req);

        // Verify admin access via session
        await requireAdmin(address);

        const { searchParams } = new URL(req.url);
        const sort = searchParams.get("sort") || "joined";
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

        const supabase = getSupabaseServerClient();

        let solPriceUsd = 0;
        try {
            const priceRes = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/price/sol`
            );
            if (priceRes.ok) {
                const { price } = await priceRes.json();
                if (typeof price === "number" && !Number.isNaN(price)) {
                    solPriceUsd = price;
                }
            }
        } catch {
            solPriceUsd = 0;
        }

        if (!solPriceUsd || Number.isNaN(solPriceUsd)) {
            solPriceUsd = 100;
        }

        const rangeFrom = (page - 1) * limit;
        const rangeTo = rangeFrom + limit - 1;

        const { data: profiles, count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(rangeFrom, rangeTo);

        const enrichedUsers = await Promise.all(
            (profiles || []).map(async (profile) => {
                const { data: buyerOrders } = await supabase
                    .from("orders")
                    .select("amount, currency")
                    .eq("buyer_address", profile.address);

                const totalSpentSol =
                    buyerOrders?.reduce((sum, order) => {
                        if (order.currency === "SOL") {
                            return sum + (parseFloat(order.amount.toString()) || 0);
                        }
                        return sum;
                    }, 0) || 0;

                const totalSpentUsdc =
                    buyerOrders?.reduce((sum, order) => {
                        if (order.currency === "USDC") {
                            return sum + (parseFloat(order.amount.toString()) || 0);
                        }
                        return sum;
                    }, 0) || 0;

                const totalSpentUsd = totalSpentSol * solPriceUsd + totalSpentUsdc;

                const { data: stores } = await supabase
                    .from("stores")
                    .select("id")
                    .eq("owner_address", profile.address);

                let totalRevenueSol = 0;
                let totalRevenueUsdc = 0;

                if (stores && stores.length > 0) {
                    const storeIds = stores.map((s) => s.id);
                    const { data: sellerOrders } = await supabase
                        .from("orders")
                        .select("amount, currency")
                        .in("store_id", storeIds)
                        .eq("status", "completed");

                    totalRevenueSol =
                        sellerOrders?.reduce((sum, order) => {
                            if (order.currency === "SOL") {
                                return sum + (parseFloat(order.amount.toString()) || 0);
                            }
                            return sum;
                        }, 0) || 0;

                    totalRevenueUsdc =
                        sellerOrders?.reduce((sum, order) => {
                            if (order.currency === "USDC") {
                                return sum + (parseFloat(order.amount.toString()) || 0);
                            }
                            return sum;
                        }, 0) || 0;
                }

                const totalRevenueUsd = totalRevenueSol * solPriceUsd + totalRevenueUsdc;

                return {
                    address: profile.address,
                    name: profile.name || "Unknown",
                    email: profile.email || "",
                    school: profile.school,
                    campus: profile.campus,
                    points: profile.points || 0,
                    totalSpent: totalSpentUsd,
                    totalRevenue: totalRevenueUsd,
                    totalSpentSol,
                    totalSpentUsdc,
                    totalRevenueSol,
                    totalRevenueUsdc,
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
            total: totalUsers || 0,
            page,
            limit,
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
