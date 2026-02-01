import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
    try {
        const address = await getSessionWallet(req);

        await requireAdmin(address);

        const supabase = getSupabaseServerClient();

        // 1. Get total users
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

        // 2. Get total stores
        const { count: totalStores } = await supabase
            .from("stores")
            .select("*", { count: "exact", head: true });

        // 3. Get total orders
        const { count: totalOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true });

        const { count: completedOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed");

        const { count: pendingOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        const { data: completedOrdersData } = await supabase
            .from("orders")
            .select("amount, currency")
            .eq("status", "completed");

        let gmvSol = 0;
        let gmvUsdc = 0;

        if (completedOrdersData && completedOrdersData.length > 0) {
            for (const order of completedOrdersData as any[]) {
                const amount = parseFloat(order.amount?.toString?.() || "0") || 0;
                if (order.currency === "USDC") {
                    gmvUsdc += amount;
                } else {
                    gmvSol += amount;
                }
            }
        }

        const platformFeesSol = gmvSol * 0.05;
        const platformFeesUsdc = gmvUsdc * 0.05;
        const sellerRevenueSol = gmvSol * 0.95;
        const sellerRevenueUsdc = gmvUsdc * 0.95;

        // 5. Get withdrawal stats
        const { count: pendingWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        const { count: processingWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "processing");

        const { count: completedWithdrawals } = await supabase
            .from("withdrawal_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed");

        const { data: completedWithdrawalsData } = await supabase
            .from("withdrawal_requests")
            .select("amount")
            .eq("status", "completed");

        const totalPaidOut = completedWithdrawalsData?.reduce((sum, w) => {
            return sum + (parseFloat(w.amount.toString()) || 0);
        }, 0) || 0;

        // 6. Get recent activity (last 7 days users)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: newUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        // 7. Get subscription revenue
        const { data: subscriptionTransactions } = await supabase
            .from("subscription_transactions")
            .select("amount, currency")
            .eq("status", "completed");

        const subscriptionRevenueSol = subscriptionTransactions?.reduce((sum, tx) => {
            if (tx.currency === "SOL") {
                return sum + (parseFloat(tx.amount.toString()) || 0);
            }
            return sum;
        }, 0) || 0;

        const subscriptionRevenueUsdc = subscriptionTransactions?.reduce((sum, tx) => {
            if (tx.currency === "USDC") {
                return sum + (parseFloat(tx.amount.toString()) || 0);
            }
            return sum;
        }, 0) || 0;

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

        const gmvUsd = gmvSol * solPriceUsd + gmvUsdc;
        const platformFeesUsd = platformFeesSol * solPriceUsd + platformFeesUsdc;
        const sellerRevenueUsd = sellerRevenueSol * solPriceUsd + sellerRevenueUsdc;
        const subscriptionRevenueUsd =
            subscriptionRevenueSol * solPriceUsd + subscriptionRevenueUsdc;
        const totalSubscriptionRevenueSol = subscriptionRevenueSol;
        const totalRevenueUsd = gmvUsd + subscriptionRevenueUsd;
        const totalPaidOutUsd = totalPaidOut * solPriceUsd;

        return Response.json({
            ok: true,
            stats: {
                users: {
                    total: totalUsers || 0,
                    newThisWeek: newUsers || 0,
                },
                stores: {
                    total: totalStores || 0,
                },
                orders: {
                    total: totalOrders || 0,
                    completed: completedOrders || 0,
                    pending: pendingOrders || 0,
                },
                revenue: {
                    gmv: gmvSol,
                    gmvUsdc: gmvUsdc,
                    gmvUsd: gmvUsd,
                    platformFees: platformFeesSol,
                    platformFeesUsdc: platformFeesUsdc,
                    platformFeesUsd: platformFeesUsd,
                    sellerRevenue: sellerRevenueSol,
                    sellerRevenueUsdc: sellerRevenueUsdc,
                    sellerRevenueUsd: sellerRevenueUsd,
                    subscriptionRevenue: totalSubscriptionRevenueSol,
                    subscriptionRevenueSol: subscriptionRevenueSol,
                    subscriptionRevenueUsdc: subscriptionRevenueUsdc,
                    subscriptionRevenueUsd: subscriptionRevenueUsd,
                    totalRevenue: totalRevenueUsd,
                    totalRevenueUsd: totalRevenueUsd,
                    solPriceUsd: solPriceUsd,
                    currency: "USD",
                },
                withdrawals: {
                    pending: pendingWithdrawals || 0,
                    processing: processingWithdrawals || 0,
                    completed: completedWithdrawals || 0,
                    totalPaidOut: totalPaidOut,
                    totalPaidOutUsd: totalPaidOutUsd,
                },
            },
        });
    } catch (error: any) {
        console.error("[Admin Stats] Error:", error);

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
