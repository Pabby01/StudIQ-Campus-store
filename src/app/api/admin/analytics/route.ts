import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d";

    const supabase = getSupabaseServerClient();

    // Calculate date range
    const now = new Date();
    let startDate = new Date(now);

    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (range === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { count: totalUsersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: newUsersThisMonth } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart);

    const { count: newUsersToday } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    const { data: orderStats } = await supabase
      .from("orders")
      .select("id, amount, created_at")
      .gte("created_at", startDate.toISOString());

    const totalOrders = orderStats?.length || 0;
    const totalRevenue = orderStats?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    const { data: monthOrderStats } = await supabase
      .from("orders")
      .select("id, amount")
      .gte("created_at", monthStart);

    const ordersThisMonth = monthOrderStats?.length || 0;
    const revenueThisMonth = monthOrderStats?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    const { data: activeOrderUsers } = await supabase
      .from("orders")
      .select("buyer_address")
      .gte("created_at", monthStart);
    const activeUsersThisMonth = new Set((activeOrderUsers || []).map((u) => u.buyer_address)).size;

    const { data: subscriptionTransactions } = await supabase
      .from("subscription_transactions")
      .select("amount, status, created_at")
      .gte("created_at", startDate.toISOString());

    const completedSubscriptions = (subscriptionTransactions || []).filter(
      (tx) => (tx.status || "").toLowerCase() === "completed"
    );
    const subscriptionRevenue = completedSubscriptions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: lastMonthOrders } = await supabase
      .from("orders")
      .select("amount")
      .gte("created_at", lastMonthStart)
      .lt("created_at", lastMonthEnd);

    const lastMonthRevenue = (lastMonthOrders || []).reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0
    );
    const revenueGrowth =
      lastMonthRevenue > 0 ? ((revenueThisMonth - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 30 : 52;
    const labels: string[] = [];
    const users: number[] = [];
    const orders: number[] = [];
    const revenue: number[] = [];

    const usersByDate = new Map<string, number>();
    const ordersByDate = new Map<string, number>();
    const revenueByDate = new Map<string, number>();

    const { data: usersInRange } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    for (const u of usersInRange || []) {
      const key = (u.created_at || "").split("T")[0];
      usersByDate.set(key, (usersByDate.get(key) || 0) + 1);
    }

    for (const o of orderStats || []) {
      const key = (o.created_at || "").split("T")[0];
      ordersByDate.set(key, (ordersByDate.get(key) || 0) + 1);
      revenueByDate.set(key, (revenueByDate.get(key) || 0) + (Number(o.amount) || 0));
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      labels.push(dateStr);
      users.push(usersByDate.get(dateStr) || 0);
      orders.push(ordersByDate.get(dateStr) || 0);
      revenue.push(revenueByDate.get(dateStr) || 0);
    }

    return Response.json({
      totalUsers: totalUsersCount || 0,
      newUsersToday: newUsersToday || 0,
      activeUsersThisMonth,
      totalOrders,
      ordersThisMonth,
      totalRevenue: totalRevenue + subscriptionRevenue,
      revenueThisMonth,
      subscriptionRevenue,
      revenueGrowth,
      avgOrderValue,
      conversionRate: totalUsersCount ? (totalOrders / totalUsersCount) * 100 : 0,
      chartData: {
        labels,
        users,
        orders,
        revenue,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return Response.json(
      { ok: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
