"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { usePoints } from "@/hooks/usePoints";
import DashboardCard from "@/components/DashboardCard";
import { ShoppingBag, DollarSign, Award, TrendingUp } from "lucide-react";

type PointLog = Readonly<{ points: number }>;

export default function DashboardPage() {
  const auth = useWalletAuth();
  const points = usePoints(auth.address ?? null);
  const totalPoints = (points.history as PointLog[]).reduce((s, r) => s + r.points, 0);

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
            value={totalPoints}
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
