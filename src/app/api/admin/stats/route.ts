import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminAddress = searchParams.get("admin");

        // Verify admin access
        requireAdmin(adminAddress);

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

        // 4. Calculate revenue (from completed orders)
        const { data: completedOrdersData } = await supabase
            .from("orders")
            .select("amount, currency")
            .eq("status", "completed");

        const gmv = completedOrdersData?.reduce((sum, order) => {
            return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0) || 0;

        const platformFees = gmv * 0.05; // 5% platform fee
        const sellerRevenue = gmv * 0.95;

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
            if (tx.currency === 'SOL') {
                return sum + (parseFloat(tx.amount.toString()) || 0);
            }
            return sum;
        }, 0) || 0;

        const subscriptionRevenueUsdc = subscriptionTransactions?.reduce((sum, tx) => {
            if (tx.currency === 'USDC') {
                return sum + (parseFloat(tx.amount.toString()) || 0);
            }
            return sum;
        }, 0) || 0;

        const totalSubscriptionRevenue = subscriptionRevenueSol; // + USDC when available

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
                    gmv: gmv,
                    platformFees: platformFees,
                    sellerRevenue: sellerRevenue,
                    subscriptionRevenue: totalSubscriptionRevenue,
                    subscriptionRevenueSol: subscriptionRevenueSol,
                    subscriptionRevenueUsdc: subscriptionRevenueUsdc,
                    totalRevenue: gmv + totalSubscriptionRevenue,
                    currency: "SOL",
                },
                withdrawals: {
                    pending: pendingWithdrawals || 0,
                    processing: processingWithdrawals || 0,
                    completed: completedWithdrawals || 0,
                    totalPaidOut: totalPaidOut,
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
