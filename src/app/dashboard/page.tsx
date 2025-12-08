"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/react-hooks";
import DashboardCard from "@/components/DashboardCard";
import { ShoppingBag, DollarSign, Award, TrendingUp, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const wallet = useWallet();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, [wallet.status]);

  async function fetchPoints() {
    if (wallet.status !== "connected") {
      setLoading(false);
      return;
    }

    try {
      const address = wallet.session.account.address.toString();
      const res = await fetch(`/api/profile/get?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setPoints(data?.profile?.points || 0);
      }
    } catch (error) {
      console.error("Failed to fetch points:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-muted-text">Welcome back! Here's your store overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Total Orders"
            value="0"
            icon={ShoppingBag}
            trend={{ value: "0%", isPositive: true }}
          />
          <DashboardCard
            title="Revenue"
            value="$0.00"
            icon={DollarSign}
            trend={{ value: "0%", isPositive: true }}
          />
          <DashboardCard
            title="Reward Points"
            value={points.toString()}
            icon={Award}
          />
          <DashboardCard
            title="Growth"
            value="0%"
            icon={TrendingUp}
            trend={{ value: "0%", isPositive: true }}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border-gray shadow-sm p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
          <div className="text-center py-12">
            <p className="text-muted-text">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}

