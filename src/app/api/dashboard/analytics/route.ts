import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    const range = url.searchParams.get("range") || "30"; // days

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        // Fetch buyer orders
        const { data: buyerOrders } = await supabase
            .from("orders")
            .select("created_at, amount, currency, status")
            .eq("buyer_address", address)
            .gte("created_at", startDate.toISOString())
            .neq("status", "failed")
            .order("created_at", { ascending: true });

        // Fetch seller orders
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

        // Fetch points history
        const { data: pointsHistory } = await supabase
            .from("point_logs")
            .select("created_at, points, reason")
            .eq("address", address)
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true });

        // Generate daily data points
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
            const dateStr = date.toISOString().split('T')[0];

            labels.push(formatDateLabel(date));

            // Count buyer orders for this day
            const dayBuyerOrders = (buyerOrders || []).filter(o =>
                o.created_at.startsWith(dateStr)
            );
            buyerOrderCounts.push(dayBuyerOrders.length);
            buyerRevenue.push(
                dayBuyerOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
            );

            // Count seller orders for this day
            const daySellerOrders = sellerOrders.filter(o =>
                o.created_at.startsWith(dateStr)
            );
            sellerOrderCounts.push(daySellerOrders.length);
            sellerRevenue.push(
                daySellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
            );

            // Calculate cumulative points
            const dayPoints = (pointsHistory || [])
                .filter(p => p.created_at.startsWith(dateStr))
                .reduce((sum, p) => sum + p.points, 0);
            cumulativePoints += dayPoints;
            pointsData.push(cumulativePoints);
        }

        return NextResponse.json({
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
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

function formatDateLabel(date: Date): string {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}
