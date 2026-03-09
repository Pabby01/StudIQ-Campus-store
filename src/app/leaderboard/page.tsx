/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Loader2, Sparkles, TrendingUp, Search } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { motion } from "framer-motion";
import Image from "next/image";

type LeaderboardEntry = {
    rank: number;
    address: string;
    name: string;
    points: number;
    badge: string;
    avatar_url?: string;
};

type UserRank = {
    rank: number;
    points: number;
    badge: string;
};

export default function LeaderboardPage() {
    const { walletAddress } = useCivicWallet();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRank | null>(null);
    const [range, setRange] = useState<"all" | "month" | "week">("all");
    const [loading, setLoading] = useState(true);

    const address = walletAddress;

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

    const getRankStyle = (rank: number) => {
        if (rank === 1) return "bg-yellow-100 text-yellow-700 border-yellow-200 ring-4 ring-yellow-50";
        if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-200 ring-4 ring-slate-50";
        if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-200 ring-4 ring-orange-50";
        return "bg-white text-slate-600 border-slate-100";
    };

    const TopThree = ({ entry }: { entry: LeaderboardEntry }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative flex flex-col items-center p-6 rounded-[2rem] border ${getRankStyle(entry.rank)} ${entry.rank === 1 ? 'order-2 -mt-8 z-10 shadow-xl' : entry.rank === 2 ? 'order-1 mt-4 shadow-lg' : 'order-3 mt-8 shadow-lg'} w-full sm:w-1/3 min-w-[140px]`}
        >
            {entry.rank === 1 && (
                <div className="absolute -top-6">
                    <Crown className="w-12 h-12 text-yellow-500 fill-yellow-200 animate-bounce" />
                </div>
            )}
            <div className="relative w-20 h-20 mb-3">
                <div className={`relative w-full h-full rounded-full overflow-hidden border-4 ${entry.rank === 1 ? 'border-yellow-400' : entry.rank === 2 ? 'border-slate-300' : 'border-orange-300'}`}>
                    <Image 
                        src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.name)}`}
                        alt={entry.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-sm border border-slate-100">
                    <span className="text-lg font-bold">#{entry.rank}</span>
                </div>
            </div>
            <h3 className="font-bold text-slate-900 text-center truncate w-full">{entry.name}</h3>
            <p className="text-sm text-slate-500 mb-2 truncate w-full text-center">{entry.address.slice(0, 4)}...{entry.address.slice(-4)}</p>
            <div className="bg-white/50 px-4 py-1 rounded-full border border-black/5">
                <span className="font-bold text-primary-blue">{entry.points.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1">pts</span>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20">
            {/* Header Section */}
            <div className="bg-slate-900 text-white pt-12 pb-24 px-4 rounded-b-[2.5rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-medium text-white/90">Season 1 Leaderboard</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl text-white font-bold mb-4 tracking-tight">Top Performers</h1>
                    <p className="text-slate-300 text-lg max-w-xl mx-auto">
                        Earn points by referring friends, selling products, and being an active member of the community.
                    </p>

                    {/* Time Filter */}
                    <div className="flex justify-center gap-2 mt-8">
                        {["all", "month", "week"].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r as any)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                    range === r 
                                    ? "bg-white text-slate-900 shadow-lg scale-105" 
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                            >
                                {r === "all" ? "All Time" : r === "month" ? "This Month" : "This Week"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
                {loading ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl border border-slate-100">
                        <Loader2 className="w-8 h-8 text-primary-blue animate-spin mx-auto" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl border border-slate-100">
                        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No rankings available yet</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div className="flex flex-wrap justify-center items-end gap-4 mb-12 px-2">
                            {leaderboard.slice(0, 3).map((entry) => (
                                <TopThree key={entry.address} entry={entry} />
                            ))}
                        </div>

                        {/* List View */}
                        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-slate-900">Rankings</h3>
                                <div className="text-sm text-slate-500">
                                    Showing top {leaderboard.length}
                                </div>
                            </div>
                            
                            <div className="divide-y divide-slate-50">
                                {leaderboard.slice(3).map((entry) => (
                                    <div key={entry.address} className={`flex items-center p-4 hover:bg-slate-50 transition-colors ${entry.address === address ? 'bg-blue-50/50' : ''}`}>
                                        <div className="w-8 text-center font-bold text-slate-400 mr-4">
                                            #{entry.rank}
                                        </div>
                                        <div className="relative w-10 h-10 mr-4 shrink-0">
                                            <Image 
                                                src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.name)}`}
                                                alt={entry.name}
                                                fill
                                                className="rounded-full object-cover bg-slate-100"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h4 className="font-semibold text-slate-900 truncate">{entry.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">
                                                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">{entry.points.toLocaleString()}</div>
                                            <div className="text-xs text-slate-400">points</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Current User Fixed Bottom Bar (if not in view) */}
                            {userRank && address && !leaderboard.slice(0, 10).find(e => e.address === address) && (
                                <div className="border-t border-slate-100 bg-slate-900 text-white p-4 flex items-center shadow-2xl">
                                    <div className="w-8 text-center font-bold text-slate-400 mr-4">
                                        #{userRank.rank}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">You</div>
                                        <div className="text-xs text-slate-400">{userRank.badge} Member</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{userRank.points.toLocaleString()} pts</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
