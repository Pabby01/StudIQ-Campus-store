import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*")
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data: profiles, error, count } = await query;

    if (error) throw error;

    // Enrich with order data
    const enrichedUsers = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        // Get orders
        const { data: orders } = await supabase
          .from("orders")
          .select("amount, created_at")
          .eq("buyer_address", profile.address);

        const totalSpent = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
        const avgOrderValue = orders && orders.length > 0 ? totalSpent / orders.length : 0;
        const lastPurchase = orders && orders.length > 0 ? orders[0].created_at : null;

        // Check if seller
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_address", profile.address)
          .single();

        const isSeller = !!store;

        // Calculate spending trend (compare last 2 months)
        const now = new Date();
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const lastMonthOrders = orders?.filter(
          (o) =>
            new Date(o.created_at) >= lastMonthStart &&
            new Date(o.created_at) < thisMonthStart
        ) || [];
        const thisMonthOrders = orders?.filter(
          (o) => new Date(o.created_at) >= thisMonthStart
        ) || [];

        const lastMonthSpent = lastMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const thisMonthSpent = thisMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        const spendingTrend =
          lastMonthSpent > 0
            ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
            : thisMonthSpent > 0
            ? 100
            : 0;

        // Get device info
        const deviceType = profile.device_type || "Unknown";
        const browser = profile.browser || "Unknown";

        return {
          id: profile.address,
          email: profile.phone || "N/A",
          name: profile.name || "Unknown",
          wallet_address: profile.address,
          total_spent: Math.round(totalSpent),
          total_orders: orders?.length || 0,
          last_purchase: lastPurchase,
          city: profile.city || "Unknown",
          country: profile.country || "Unknown",
          device_type: deviceType,
          browser,
          signup_date: profile.created_at,
          last_login: profile.last_login,
          is_seller: isSeller,
          avg_order_value: Math.round(avgOrderValue),
          spending_trend: Math.round(spendingTrend),
        };
      })
    );

    // Filter by type if needed
    let filteredUsers = enrichedUsers;
    if (type === "sellers") {
      filteredUsers = enrichedUsers.filter((u) => u.is_seller);
    } else if (type === "buyers") {
      filteredUsers = enrichedUsers.filter((u) => !u.is_seller);
    }

    // Get total count
    let countQuery = supabase.from("profiles").select("id", { count: "exact" });
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }
    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      users: filteredUsers,
      total: totalCount || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
