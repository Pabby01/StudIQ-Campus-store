"use client";

import { useState, useEffect } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import DashboardCard from "@/components/DashboardCard";
import { ShoppingBag, DollarSign, Award, TrendingUp, Loader2, BarChart3, RefreshCw, Wallet } from "lucide-react";
import ShareStoreButton from "@/components/ShareStoreButton";
import RevenueChart from "@/components/charts/RevenueChart";
import OrdersChart from "@/components/charts/OrdersChart";
import PointsChart from "@/components/charts/PointsChart";
import ActivityFeed from "@/components/ActivityFeed";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type DashboardStats = {
  totalOrders: number;
  revenue: number;
  revenueBreakdown?: { // Optional breakdown
    sol: number;
    usdc: number;
    usd: number;
  };
  currency: string;
  points: number;
  growth: number;
  recentActivity: any[];
  storeId?: string;
};

type AnalyticsData = {
  labels: string[];
  orders: number[];
  revenue: number[];
  points: number[];
};

export default function DashboardPage() {
  const { walletAddress, user, email, isLoading: authLoading } = useCivicWallet();
  const [isBuyer, setIsBuyer] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use walletAddress if available, otherwise use email as identifier
  const identifier = walletAddress || (email ? `email:${email}` : null);

  useEffect(() => {
    if (identifier) {
      fetchDashboardData();
    } else if (!authLoading && user) {
      // User is authenticated but no identifier yet, show empty state
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [identifier, authLoading, user]);

  const fetchDashboardData = async (silent = false) => {
    if (!identifier) return;

    if (!silent) setLoading(true);
    setRefreshing(true);

    try {
      // Fetch stats - use identifier (could be wallet address or email:xxx)
      const statsRes = await fetch(`/api/dashboard/stats?address=${encodeURIComponent(identifier)}`);
      const statsData = await statsRes.json();

      // Fetch analytics
      const analyticsRes = await fetch(`/api/dashboard/analytics?address=${encodeURIComponent(identifier)}&range=30`);
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
    if (walletAddress) {
      fetchDashboardData();
    }
  }, [isBuyer]);

  // Only check for user, not walletAddress (wallet may still be loading)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Sign In Required</h2>
          <p className="text-lg text-muted-text mb-6">Please sign in to view your dashboard</p>
          <Button variant="primary" onClick={() => window.location.href = "/"}>
            Go to Home
          </Button>
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

            {/* Share Store Button (Seller Only) */}
            {!isBuyer && stats?.storeId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/store/${stats.storeId}`;
                  navigator.clipboard.writeText(url);
                  // Optional: You could add a temporary "Copied!" state here if you wanted to be fancy,
                  // but for now a toast or just simple feedback is fine. 
                  // Since we don't have toast imported here easily (need hook), let's just assume user knows.
                  // Actually, let's use a simple state for visual feedback.
                }}
                className="min-h-[44px]"
              >
                <ShareStoreButton storeId={stats.storeId} />
              </Button>
            )}

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
                value={`$${(stats?.revenue || 0).toFixed(2)}`}
                subtitle={
                  stats?.revenueBreakdown ? (
                    <div className="text-[10px] sm:text-xs text-muted-text mt-1 space-y-0.5">
                      {stats.revenueBreakdown.sol > 0 && <div>{stats.revenueBreakdown.sol} SOL</div>}
                      {stats.revenueBreakdown.usdc > 0 && <div>${stats.revenueBreakdown.usdc} USDC</div>}
                      {stats.revenueBreakdown.usd > 0 && <div>${stats.revenueBreakdown.usd} USD</div>}
                    </div>
                  ) : undefined
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

            {/* Earnings & Withdraw Card (Seller Only) */}
            {!isBuyer && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900 mb-1">
                        Manage Your Earnings
                      </h3>
                      <p className="text-green-700 text-sm">
                        View your balance and withdraw funds from completed orders
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => window.location.href = '/dashboard/earnings'}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Earnings
                  </Button>
                </div>
              </Card>
            )}

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


