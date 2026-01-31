/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";

type AnalyticsPayload = {
    labels: string[];
    buyer: {
        orders: number[];
        revenue: number[];
    };
    seller: {
        orders: number[];
        revenue: number[];
    };
    points: number[];
};

const analyticsCache = new Map<string, { data: AnalyticsPayload; timestamp: number }>();
const analyticsInFlight = new Map<string, Promise<AnalyticsPayload>>();
const ANALYTICS_TTL_MS = 30000;

async function computeAnalytics(address: string, days: number): Promise<AnalyticsPayload> {
    const supabase = getSupabaseServerClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: buyerOrders } = await supabase
        .from("orders")
        .select("created_at, amount, currency, status")
        .eq("buyer_address", address)
        .gte("created_at", startDate.toISOString())
        .neq("status", "failed")
        .order("created_at", { ascending: true });

    const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_address", address)
        .maybeSingle();

    let sellerOrders: any[] = [];
    if (store) {
        const { data } = await supabase
            .from("orders")
            .select("created_at, amount, currency, status")
            .eq("store_id", store.id)
            .gte("created_at", startDate.toISOString())
            .neq("status", "failed")
            .order("created_at", { ascending: true });
        sellerOrders = data || [];
    }

    const { data: pointsHistory } = await supabase
        .from("points_log")
        .select("created_at, points, reason")
        .eq("address", address)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

    const labels: string[] = [];
    const buyerOrderCounts: number[] = [];
    const buyerRevenue: number[] = [];
    const sellerOrderCounts: number[] = [];
    const sellerRevenue: number[] = [];
    const pointsData: number[] = [];

    let cumulativePoints = 0;

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const dateStr = date.toISOString().split("T")[0];

        labels.push(formatDateLabel(date));

        const dayBuyerOrders = (buyerOrders || []).filter(o =>
            o.created_at.startsWith(dateStr)
        );
        buyerOrderCounts.push(dayBuyerOrders.length);
        buyerRevenue.push(
            dayBuyerOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
        );

        const daySellerOrders = sellerOrders.filter(o =>
            o.created_at.startsWith(dateStr)
        );
        sellerOrderCounts.push(daySellerOrders.length);
        sellerRevenue.push(
            daySellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
        );

        const dayPoints = (pointsHistory || [])
            .filter(p => p.created_at.startsWith(dateStr))
            .reduce((sum, p) => sum + p.points, 0);
        cumulativePoints += dayPoints;
        pointsData.push(cumulativePoints);
    }

    return {
        labels,
        buyer: {
            orders: buyerOrderCounts,
            revenue: buyerRevenue
        },
        seller: {
            orders: sellerOrderCounts,
            revenue: sellerRevenue
        },
        points: pointsData
    };
}

export async function GET(req: Request) {
    const address = await getSessionWallet(req);
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30";

    if (!address) {
        return NextResponse.json({ error: "Session required" }, { status: 401 });
    }

    const days = parseInt(range);
    const key = `${address}:${days}`;
    const now = Date.now();
    const cached = analyticsCache.get(key);

    if (cached && now - cached.timestamp < ANALYTICS_TTL_MS) {
        return NextResponse.json(cached.data);
    }

    let promise = analyticsInFlight.get(key);
    if (!promise) {
        promise = computeAnalytics(address, days);
        analyticsInFlight.set(key, promise);
    }

    try {
        const data = await promise;
        analyticsCache.set(key, { data, timestamp: Date.now() });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    } finally {
        analyticsInFlight.delete(key);
    }
}

function formatDateLabel(date: Date): string {
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
}
