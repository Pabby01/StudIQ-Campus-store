import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    try {
        // Fetch user's orders (both as buyer and seller)
        const { data: buyerOrders } = await supabase
            .from("orders")
            .select("*")
            .eq("buyer_address", address)
            .neq("status", "failed");

        // Fetch seller's store and orders
        const { data: store } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_address", address)
            .maybeSingle();

        let sellerOrders: any[] = [];
        if (store) {
            const { data } = await supabase
                .from("orders")
                .select("*")
                .eq("store_id", store.id)
                .neq("status", "failed");
            sellerOrders = data || [];
        }

        // Fetch points - FIXED TABLE NAME
        const { data: pointsData } = await supabase
            .from("points_log")
            .select("points")
            .eq("address", address);

        const totalPoints = pointsData?.reduce((sum, log) => sum + log.points, 0) || 0;

        // Calculate buyer stats
        const buyerStats = calculateStats(buyerOrders || [], "buyer");

        // Calculate seller stats
        const sellerStats = calculateStats(sellerOrders, "seller");

        // Fetch recent activity (last 5 orders)
        const recentBuyerOrders = await supabase
            .from("orders")
            .select(`
        id,
        created_at,
        status,
        amount,
        currency,
        order_items(
          products(name)
        )
      `)
            .eq("buyer_address", address)
            .order("created_at", { ascending: false })
            .limit(5);

        const recentSellerOrders = store ? await supabase
            .from("orders")
            .select(`
        id,
        created_at,
        status,
        amount,
        currency,
        order_items(
          products(name)
        )
      `)
            .eq("store_id", store.id)
            .order("created_at", { ascending: false })
            .limit(5) : { data: [] };

        // Combine and format recent activity
        const recentActivity = [
            ...(recentBuyerOrders.data || []).map(order => formatActivity(order, "purchase")),
            ...(recentSellerOrders.data || []).map(order => formatActivity(order, "sale"))
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        return NextResponse.json({
            buyer: {
                totalOrders: buyerStats.totalOrders,
                revenue: buyerStats.revenue,
                currency: buyerStats.currency,
                growth: buyerStats.growth,
                points: totalPoints,
                recentActivity: recentActivity.filter(a => a.type === "purchase")
            },
            seller: {
                totalOrders: sellerStats.totalOrders,
                revenue: sellerStats.revenue,
                currency: sellerStats.currency,
                growth: sellerStats.growth,
                points: totalPoints,
                recentActivity: recentActivity.filter(a => a.type === "sale")
            },
            hasStore: !!store
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}

function calculateStats(orders: any[], type: "buyer" | "seller") {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Filter orders by month
    const currentMonthOrders = orders.filter(o => new Date(o.created_at) >= currentMonth);
    const lastMonthOrders = orders.filter(o =>
        new Date(o.created_at) >= lastMonth && new Date(o.created_at) < currentMonth
    );

    // Calculate totals
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Calculate growth
    const currentMonthCount = currentMonthOrders.length;
    const lastMonthCount = lastMonthOrders.length;
    const growth = lastMonthCount > 0
        ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100
        : currentMonthCount > 0 ? 100 : 0;

    // Determine primary currency
    const currencies = orders.map(o => o.currency).filter(Boolean);
    const currencyCounts = currencies.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const primaryCurrency = Object.keys(currencyCounts).length > 1
        ? "MIXED"
        : Object.keys(currencyCounts)[0] || "SOL";

    return {
        totalOrders,
        revenue: parseFloat(revenue.toFixed(2)),
        currency: primaryCurrency,
        growth: parseFloat(growth.toFixed(1))
    };
}

function formatActivity(order: any, type: "purchase" | "sale") {
    const firstProduct = order.order_items?.[0]?.products?.name || "Unknown Product";
    const itemCount = order.order_items?.length || 0;

    return {
        id: order.id,
        type,
        description: itemCount > 1
            ? `${firstProduct} and ${itemCount - 1} other item${itemCount > 2 ? 's' : ''}`
            : firstProduct,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        date: order.created_at
    };
}
