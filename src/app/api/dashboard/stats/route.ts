import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";

type StatsPayload = {
    buyer: {
        totalOrders: number;
        revenue: number;
        revenueBreakdown: {
            sol: number;
            usdc: number;
            usd: number;
        };
        currency: string;
        growth: number;
        points: number;
        recentActivity: any[];
    };
    seller: {
        totalOrders: number;
        revenue: number;
        revenueBreakdown: {
            sol: number;
            usdc: number;
            usd: number;
        };
        currency: string;
        growth: number;
        points: number;
        recentActivity: any[];
        storeId?: string;
    };
    hasStore: boolean;
};

const statsCache = new Map<string, { data: StatsPayload; timestamp: number }>();
const statsInFlight = new Map<string, Promise<StatsPayload>>();
const STATS_TTL_MS = 30000;

async function computeStats(address: string): Promise<StatsPayload> {
    const supabase = getSupabaseServerClient();

    const { data: buyerOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_address", address)
        .neq("status", "failed");

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

    const { data: pointsData } = await supabase
        .from("points_log")
        .select("points")
        .eq("address", address);

    const totalPoints = pointsData?.reduce((sum, log) => sum + log.points, 0) || 0;

    let solPrice = 0;
    try {
        const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const priceData = await priceRes.json();
        solPrice = parseFloat(priceData?.solana?.usd || "0");
    } catch (e) {
        console.error("Failed to fetch SOL price", e);
    }

    if (solPrice === 0) {
        solPrice = 145.5;
    }

    const buyerStats = calculateStats(buyerOrders || [], solPrice);
    const sellerStats = calculateStats(sellerOrders, solPrice);

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

    const recentActivity = [
        ...(recentBuyerOrders.data || []).map(order => formatActivity(order, "purchase")),
        ...(recentSellerOrders.data || []).map(order => formatActivity(order, "sale"))
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return {
        buyer: {
            totalOrders: buyerStats.totalOrders,
            revenue: buyerStats.revenueUsd,
            revenueBreakdown: buyerStats.breakdown,
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
            recentActivity: recentActivity.filter(a => a.type === "sale"),
            storeId: store?.id
        },
        hasStore: !!store
    };
}

export async function GET(req: Request) {
    const address = await getSessionWallet(req);

    if (!address) {
        return NextResponse.json({ error: "Session required" }, { status: 401 });
    }

    const key = address;
    const now = Date.now();
    const cached = statsCache.get(key);

    if (cached && now - cached.timestamp < STATS_TTL_MS) {
        return NextResponse.json(cached.data);
    }

    let promise = statsInFlight.get(key);
    if (!promise) {
        promise = computeStats(address);
        statsInFlight.set(key, promise);
    }

    try {
        const data = await promise;
        statsCache.set(key, { data, timestamp: Date.now() });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    } finally {
        statsInFlight.delete(key);
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
