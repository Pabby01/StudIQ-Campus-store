"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/react-hooks";
import DashboardCard from "@/components/DashboardCard";
import { ShoppingBag, DollarSign, Award, TrendingUp, Loader2, BarChart3, RefreshCw } from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";
import OrdersChart from "@/components/charts/OrdersChart";
import PointsChart from "@/components/charts/PointsChart";
import ActivityFeed from "@/components/ActivityFeed";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type DashboardStats = {
  totalOrders: number;
  revenue: number;
  currency: string;
  points: number;
  growth: number;
  recentActivity: any[];
};

type AnalyticsData = {
  labels: string[];
  orders: number[];
  revenue: number[];
  points: number[];
};

export default function DashboardPage() {
  const wallet = useWallet();
  const [isBuyer, setIsBuyer] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const address = wallet.status === "connected" ? wallet.session.account.address.toString() : null;

  useEffect(() => {
    if (address) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [address]);

  const fetchDashboardData = async (silent = false) => {
    if (!address) return;

    if (!silent) setLoading(true);
    setRefreshing(true);

    try {
      // Fetch stats
      const statsRes = await fetch(`/api/dashboard/stats?address=${address}`);
      const statsData = await statsRes.json();

      // Fetch analytics
      const analyticsRes = await fetch(`/api/dashboard/analytics?address=${address}&range=30`);
      const analyticsData = await analyticsRes.json();

      setStats(isBuyer ? statsData.buyer : statsData.seller);
      setAnalytics(isBuyer ? {
        labels: analyticsData.labels,
        orders: analyticsData.buyer.orders,
        revenue: analyticsData.buyer.revenue,
        points: analyticsData.points
      } : {
        labels: analyticsData.labels,
        orders: analyticsData.seller.orders,
        revenue: analyticsData.seller.revenue,
        points: analyticsData.points
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when toggling between buyer/seller
  useEffect(() => {
    if (address) {
      fetchDashboardData();
    }
  }, [isBuyer]);

  if (wallet.status !== "connected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Connect Your Wallet</h2>
          <p className="text-lg text-muted-text">Please connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-1 truncate">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-text">Welcome back! Here's your overview</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* View Toggle */}
            <div className="bg-white rounded-lg border border-border-gray p-1 flex gap-1">
              <button
                onClick={() => setIsBuyer(true)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${isBuyer
                  ? 'bg-primary-blue text-white'
                  : 'text-muted-text hover:bg-gray-50'
                  }`}
              >
                Buyer
              </button>
              <button
                onClick={() => setIsBuyer(false)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${!isBuyer
                  ? 'bg-primary-blue text-white'
                  : 'text-muted-text hover:bg-gray-50'
                  }`}
              >
                Seller
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <DashboardCard
                title={isBuyer ? "Total Purchases" : "Total Orders"}
                value={stats?.totalOrders.toString() || "0"}
                icon={ShoppingBag}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
              <DashboardCard
                title={isBuyer ? "Total Spent" : "Revenue"}
                value={
                  stats?.currency === "SOL"
                    ? `${stats.revenue.toFixed(2)} SOL`
                    : stats?.currency === "USDC"
                      ? `$${stats.revenue.toFixed(2)}`
                      : `$${(stats?.revenue || 0).toFixed(2)}`
                }
                icon={DollarSign}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
              <DashboardCard
                title="Reward Points"
                value={(stats?.points || 0).toString()}
                icon={Award}
              />
              <DashboardCard
                title="Growth"
                value={`${stats?.growth?.toFixed(1) || 0}%`}
                icon={TrendingUp}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-blue" />
                  {isBuyer ? "Spending Trend" : "Revenue Trend"}
                </h3>
                <div className="w-full overflow-x-auto">
                  <RevenueChart data={analytics?.revenue || []} labels={analytics?.labels || []} />
                </div>
              </Card>

              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-blue" />
                  {isBuyer ? "Purchase Volume" : "Order Volume"}
                </h3>
                <div className="w-full overflow-x-auto">
                  <OrdersChart data={analytics?.orders || []} labels={analytics?.labels || []} />
                </div>
              </Card>
            </div>

            {/* Points Chart & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-blue" />
                  Points Growth
                </h3>
                <div className="w-full overflow-x-auto">
                  <PointsChart data={analytics?.points || []} labels={analytics?.labels || []} />
                </div>
              </Card>

              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
                <ActivityFeed activities={stats?.recentActivity || []} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
