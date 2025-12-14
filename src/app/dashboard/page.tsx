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

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [address, isBuyer]);

  const fetchDashboardData = async (silent = false) => {
    if (!address) return;

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch stats
      const statsRes = await fetch(`/api/dashboard/stats?address=${address}`);
      if (statsRes.ok) {
        const data = await statsRes.json();

        // Use buyer or seller stats based on view
        const viewStats = isBuyer ? data.buyer : data.seller;
        setStats(viewStats);
      }

      // Fetch analytics
      const analyticsRes = await fetch(`/api/dashboard/analytics?address=${address}&range=30`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();

        // Use buyer or seller analytics based on view
        setAnalytics({
          labels: data.labels,
          orders: isBuyer ? data.buyer.orders : data.seller.orders,
          revenue: isBuyer ? data.buyer.revenue : data.seller.revenue,
          points: data.points
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-text">Please connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
            <p className="text-muted-text">Welcome back! Here's your overview</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-white rounded-lg border border-border-gray p-1 flex gap-1">
              <button
                onClick={() => setIsBuyer(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isBuyer
                  ? 'bg-primary-blue text-white'
                  : 'text-muted-text hover:bg-gray-50'
                  }`}
              >
                Buyer
              </button>
              <button
                onClick={() => setIsBuyer(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isBuyer
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
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue/Expenses Chart */}
          <Card className={`p-6 ${isBuyer ? 'border-l-4 border-blue-500' : 'border-l-4 border-green-500'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${isBuyer ? 'bg-blue-100' : 'bg-green-100'}`}>
                <BarChart3 className={`w-5 h-5 ${isBuyer ? 'text-blue-600' : 'text-green-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-black">{isBuyer ? 'Spending' : 'Revenue'} Trend</h3>
            </div>
            {analytics ? (
              <RevenueChart
                data={{ labels: analytics.labels, revenue: analytics.revenue }}
                currency={stats?.currency || "SOL"}
              />
            ) : (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
              </div>
            )}
          </Card>

          {/* Orders Chart */}
          <Card className={`p-6 ${isBuyer ? 'border-l-4 border-indigo-500' : 'border-l-4 border-orange-500'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${isBuyer ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                <ShoppingBag className={`w-5 h-5 ${isBuyer ? 'text-indigo-600' : 'text-orange-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-black">{isBuyer ? 'Purchase' : 'Order'} Volume</h3>
            </div>
            {analytics ? (
              <OrdersChart
                data={{ labels: analytics.labels, orders: analytics.orders }}
              />
            ) : (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
              </div>
            )}
          </Card>
        </div>

        {/* Points Chart - Full Width */}
        {isBuyer && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-black">Points Accumulation</h3>
            </div>
            {analytics ? (
              <PointsChart
                data={{ labels: analytics.labels, points: analytics.points }}
              />
            ) : (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
              </div>
            )}
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
          <ActivityFeed activities={stats?.recentActivity || []} />
        </Card>
      </div>
    </div>
  );
}
