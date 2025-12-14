import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "all"; // all, month, week
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const userAddress = url.searchParams.get("address"); // Optional: to get user's rank

    const supabase = getSupabaseServerClient();

    try {
        // Calculate date filters
        let dateFilter: string | null = null;
        const now = new Date();

        if (range === "month") {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = monthStart.toISOString();
        } else if (range === "week") {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            dateFilter = weekStart.toISOString();
        }

        // Build query for aggregating points
        let query = supabase
            .from("point_logs")
            .select("address, points");

        if (dateFilter) {
            query = query.gte("created_at", dateFilter);
        }

        const { data: pointLogs, error } = await query;

        if (error) {
            console.error("Leaderboard fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
        }

        // Aggregate points by address
        const pointsByAddress = pointLogs?.reduce((acc, log) => {
            acc[log.address] = (acc[log.address] || 0) + log.points;
            return acc;
        }, {} as Record<string, number>) || {};

        // Convert to array and sort
        const rankings = Object.entries(pointsByAddress)
            .map(([address, points]) => ({ address, points }))
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);

        // Fetch profile info for top users
        const addresses = rankings.map(r => r.address);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("address, name")
            .in("address", addresses);

        // Merge profile data
        const leaderboard = rankings.map((rank, index) => {
            const profile = profiles?.find(p => p.address === rank.address);
            return {
                rank: index + 1,
                address: rank.address,
                name: profile?.name || `User ${rank.address.slice(0, 6)}`,
                points: rank.points,
                badge: getBadge(rank.points)
            };
        });

        // Get user's rank if address provided
        let userRank = null;
        if (userAddress) {
            const userIndex = rankings.findIndex(r => r.address === userAddress);
            if (userIndex !== -1) {
                userRank = {
                    rank: userIndex + 1,
                    points: rankings[userIndex].points,
                    badge: getBadge(rankings[userIndex].points)
                };
            } else {
                // User not in top rankings, calculate their position
                const userPoints = pointsByAddress[userAddress] || 0;
                const totalUsers = Object.keys(pointsByAddress).length;
                const usersAbove = Object.values(pointsByAddress).filter(p => p > userPoints).length;

                userRank = {
                    rank: usersAbove + 1,
                    points: userPoints,
                    badge: getBadge(userPoints)
                };
            }
        }

        return NextResponse.json({
            leaderboard,
            userRank,
            totalParticipants: Object.keys(pointsByAddress).length
        });

    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getBadge(points: number): string {
    if (points >= 10000) return "Legend";
    if (points >= 5000) return "Diamond";
    if (points >= 1000) return "Gold";
    if (points >= 500) return "Silver";
    if (points >= 100) return "Bronze";
    return "Newbie";
}
