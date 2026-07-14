import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    const supabase = getSupabaseServerClient();

    // Get total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get new users this month
    const monthStart = new Date();
    monthStart.setDate(1);
    const { count: newUsersThisMonth } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("signup_date", monthStart.toISOString());

    // Get users with their order stats
    const { data: users } = await supabase
      .from("profiles")
      .select("id, address, name, school, city, country, age_range, signup_date, last_login, points")
      .range(offset, offset + limit - 1)
      .order("signup_date", { ascending: false });

    // Get order stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, amount")
          .eq("buyer_address", user.address);

        const total_orders = orders?.length || 0;
        const total_spent = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

        return {
          ...user,
          total_orders,
          total_spent,
        };
      })
    );

    // Calculate demographics
    const topCountries = new Map<string, number>();
    const ageDistribution: Record<string, number> = {};
    let totalSpent = 0;

    users?.forEach((user) => {
      if (user.country) {
        topCountries.set(user.country, (topCountries.get(user.country) || 0) + 1);
      }
      if (user.age_range) {
        ageDistribution[user.age_range] = (ageDistribution[user.age_range] || 0) + 1;
      }
    });

    usersWithStats.forEach((user) => {
      totalSpent += user.total_spent || 0;
    });

    const topCountriesArray = Array.from(topCountries.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgSpent = users?.length ? totalSpent / users.length : 0;

    return Response.json({
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      totalSpent,
      avgSpent,
      topCountries: topCountriesArray,
      ageDistribution,
      users: usersWithStats,
    });
  } catch (error) {
    console.error("User analytics error:", error);
    return Response.json(
      { ok: false, error: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
