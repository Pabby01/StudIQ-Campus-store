import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getWalletAddress } from "@/lib/addressResolver";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const addressParam = url.searchParams.get("address");

    if (!addressParam) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Resolve email:xxx format to wallet address
    const address = await getWalletAddress(addressParam);

    if (!address) {
        // Return empty stats for users without profiles yet
        return NextResponse.json({
            buyer: {
                totalOrders: 0,
                revenue: 0,
                currency: "SOL",
                growth: 0,
                points: 0,
                recentActivity: []
            },
            seller: {
                totalOrders: 0,
                revenue: 0,
                currency: "SOL",
                growth: 0,
                points: 0,
                recentActivity: []
            },
            hasStore: false
        });
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

        // Fetch SOL Price for currency conversion
        let solPrice = 0;
        try {
            // Use Jupiter v4 API for consistency with wallet
            const priceRes = await fetch("https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112");
            const priceData = await priceRes.json();
            solPrice = priceData?.data?.["So11111111111111111111111111111111111111112"]?.price || 0;
        } catch (e) {
            console.error("Failed to fetch SOL price", e);
        }

        // Fallback price if fetch fails (prevent $0.00 stats for SOL users)
        if (solPrice === 0) {
            solPrice = 145.50; // Approximate fallback
        }

        // Calculate buyer stats
        const buyerStats = calculateStats(buyerOrders || [], solPrice);

        // Calculate seller stats
        const sellerStats = calculateStats(sellerOrders, solPrice);

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
                revenue: buyerStats.revenueUsd, // Use USD total
                revenueBreakdown: buyerStats.breakdown, // Pass breakdown
                currency: "USD",
                growth: buyerStats.growth,
                points: totalPoints,
                recentActivity: recentActivity.filter(a => a.type === "purchase")
            },
            seller: {
                totalOrders: sellerStats.totalOrders,
                revenue: sellerStats.revenueUsd,
                revenueBreakdown: sellerStats.breakdown,
                currency: "USD",
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

function calculateStats(orders: any[], solPrice: number) {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Filter orders by month
    const currentMonthOrders = orders.filter(o => new Date(o.created_at) >= currentMonth);
    const lastMonthOrders = orders.filter(o =>
        new Date(o.created_at) >= lastMonth && new Date(o.created_at) < currentMonth
    );

    // Calculate totals breakdown
    let totalSol = 0;
    let totalUsdc = 0;
    let totalUsd = 0; // Explicit USD orders

    orders.forEach(o => {
        const amt = o.amount || 0;
        if (o.currency === "SOL") totalSol += amt;
        else if (o.currency === "USDC") totalUsdc += amt;
        else if (o.currency === "USD") totalUsd += amt;
        else {
            // Default logic if currency missing (assume SOL for legacy?)
            // Or assume USD if we switched?
            // Safer to check amt size? No. Default to SOL for now based on legacy data.
            totalSol += amt;
        }
    });

    const revenueUsd = totalUsd + totalUsdc + (totalSol * (solPrice || 0));

    // Calculate growth (order count based)
    const currentMonthCount = currentMonthOrders.length;
    const lastMonthCount = lastMonthOrders.length;
    const growth = lastMonthCount > 0
        ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100
        : currentMonthCount > 0 ? 100 : 0;

    return {
        totalOrders: orders.length,
        revenueUsd: parseFloat(revenueUsd.toFixed(2)),
        breakdown: {
            sol: parseFloat(totalSol.toFixed(4)),
            usdc: parseFloat(totalUsdc.toFixed(2)),
            usd: parseFloat(totalUsd.toFixed(2))
        },
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
