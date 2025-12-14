"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown, TrendingUp, Loader2 } from "lucide-react";
import { useWallet } from "@solana/react-hooks";
import Card from "@/components/ui/Card";

type LeaderboardEntry = {
    rank: number;
    address: string;
    name: string;
    points: number;
    badge: string;
};

type UserRank = {
    rank: number;
    points: number;
    badge: string;
};

export default function LeaderboardPage() {
    const wallet = useWallet();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRank | null>(null);
    const [range, setRange] = useState<"all" | "month" | "week">("all");
    const [loading, setLoading] = useState(true);

    const address = wallet.status === "connected" ? wallet.session.account.address.toString() : null;

    useEffect(() => {
        fetchLeaderboard();
    }, [range, address]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ range });
            if (address) params.append("address", address);

            const res = await fetch(`/api/leaderboard?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
                setUserRank(data.userRank || null);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeColor = (badge: string) => {
        switch (badge) {
            case "Legend": return "bg-purple-100 text-purple-700 border-purple-200";
            case "Diamond": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Gold": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Silver": return "bg-gray-100 text-gray-700 border-gray-300";
            case "Bronze": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-green-100 text-green-700 border-green-200";
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
        return <span className="text-lg font-bold text-muted-text">#{rank}</span>;
    };

    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Trophy className="w-12 h-12 text-yellow-500" />
                        <h1 className="text-4xl font-bold text-black">Leaderboard</h1>
                    </div>
                    <p className="text-lg text-muted-text">
                        Top point earners on StudIQ Campus Store
                    </p>
                </div>

                {/* Range Filter */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setRange("all")}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${range === "all"
                                ? "bg-primary-blue text-white"
                                : "bg-white text-muted-text border border-border-gray hover:bg-gray-50"
                            }`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setRange("month")}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${range === "month"
                                ? "bg-primary-blue text-white"
                                : "bg-white text-muted-text border border-border-gray hover:bg-gray-50"
                            }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setRange("week")}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${range === "week"
                                ? "bg-primary-blue text-white"
                                : "bg-white text-muted-text border border-border-gray hover:bg-gray-50"
                            }`}
                    >
                        This Week
                    </button>
                </div>

                {/* User's Rank Card */}
                {userRank && address && (
                    <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-full">
                                    <TrendingUp className="w-6 h-6 text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-text">Your Rank</p>
                                    <p className="text-2xl font-bold text-black">#{userRank.rank}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-text">Total Points</p>
                                <p className="text-2xl font-bold text-black">{userRank.points.toLocaleString()}</p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getBadgeColor(userRank.badge)}`}>
                                    {userRank.badge}
                                </span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Leaderboard Table */}
                <Card className="overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-24">
                            <Trophy className="w-12 h-12 text-muted-text mx-auto mb-4" />
                            <p className="text-muted-text">No rankings available yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border-gray">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">Rank</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">User</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-black">Points</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-black">Badge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-gray">
                                    {leaderboard.map((entry) => (
                                        <tr
                                            key={entry.address}
                                            className={`hover:bg-gray-50 transition-colors ${entry.address === address ? "bg-blue-50" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-black">{entry.name}</p>
                                                    <p className="text-sm text-muted-text">
                                                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-black">{entry.points.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getBadgeColor(entry.badge)}`}>
                                                    {entry.badge}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Badge Legend */}
                <Card className="p-6 mt-8">
                    <h3 className="text-lg font-semibold text-black mb-4">Badge Tiers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { name: "Legend", points: "10,000+", color: getBadgeColor("Legend") },
                            { name: "Diamond", points: "5,000+", color: getBadgeColor("Diamond") },
                            { name: "Gold", points: "1,000+", color: getBadgeColor("Gold") },
                            { name: "Silver", points: "500+", color: getBadgeColor("Silver") },
                            { name: "Bronze", points: "100+", color: getBadgeColor("Bronze") },
                            { name: "Newbie", points: "0-99", color: getBadgeColor("Newbie") }
                        ].map((badge) => (
                            <div key={badge.name} className="text-center">
                                <Award className="w-8 h-8 mx-auto mb-2 text-muted-text" />
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${badge.color} mb-1`}>
                                    {badge.name}
                                </span>
                                <p className="text-xs text-muted-text">{badge.points} pts</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
