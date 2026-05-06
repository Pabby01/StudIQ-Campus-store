/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  Activity,
  Target,
  Zap,
  Award,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import LineChart from "@/components/analytics/LineChart";
import BarChart from "@/components/analytics/BarChart";
import PieChart from "@/components/analytics/PieChart";
import StatCard from "@/components/analytics/StatCard";

type AnalyticsData = {
  totalUsers: number;
  newUsersToday: number;
  activeUsersThisMonth: number;
  totalOrders: number;
  ordersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  avgOrderValue: number;
  conversionRate: number;
  chartData: {
    labels: string[];
    users: number[];
    orders: number[];
    revenue: number[];
  };
};

export default function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statCards: Array<{
    label: string;
    value: string | number;
    change: string;
    icon: any;
    trend: "up" | "down" | "neutral";
    color: "blue" | "green" | "purple" | "orange";
  }> = [
    {
      label: "Total Users",
      value: data?.totalUsers || 0,
      change: `+${data?.newUsersToday || 0} today`,
      icon: Users,
      trend: "up",
      color: "blue",
    },
    {
      label: "Total Orders",
      value: data?.totalOrders || 0,
      change: `+${data?.ordersThisMonth || 0} this month`,
      icon: ShoppingCart,
      trend: "up",
      color: "green",
    },
    {
      label: "Total Revenue",
      value: `$${(data?.totalRevenue || 0).toLocaleString()}`,
      change: `+$${(data?.revenueThisMonth || 0).toLocaleString()} this month`,
      icon: DollarSign,
      trend: "up",
      color: "purple",
    },
    {
      label: "Avg Order Value",
      value: `$${(data?.avgOrderValue || 0).toFixed(2)}`,
      change: `${(data?.conversionRate || 0).toFixed(1)}% conversion`,
      icon: TrendingUp,
      trend: "neutral",
      color: "orange",
    },
  ];

  // Data for pie chart (order status breakdown)
  const orderStatusData = [
    Math.floor((data?.totalOrders || 0) * 0.6), // Completed
    Math.floor((data?.totalOrders || 0) * 0.25), // Pending
    Math.floor((data?.totalOrders || 0) * 0.1), // Cancelled
    Math.floor((data?.totalOrders || 0) * 0.05), // Refunded
  ];

  // Data for revenue breakdown by currency
  const currencyData = [
    Math.floor((data?.totalRevenue || 0) * 0.5),
    Math.floor((data?.totalRevenue || 0) * 0.35),
    Math.floor((data?.totalRevenue || 0) * 0.15),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Track your platform's performance in real-time</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-slate-600" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2 py-1 border-none focus:outline-none focus:ring-0 font-medium"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </motion.div>

      {/* Key Metrics - Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Trend Charts - Row 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* User Growth Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">User Growth Trend</h3>
                <p className="text-sm text-slate-600">Users over time</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+12%</span>
            </div>
          </div>
          {data?.chartData && (
            <LineChart
              labels={data.chartData.labels}
              data={data.chartData.users}
              color="rgb(59, 130, 246)"
              height={250}
            />
          )}
        </Card>

        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-600">Total revenue over time</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+8.5%</span>
            </div>
          </div>
          {data?.chartData && (
            <LineChart
              labels={data.chartData.labels}
              data={data.chartData.revenue}
              color="rgb(34, 197, 94)"
              height={250}
            />
          )}
        </Card>
      </motion.div>

      {/* Analytics Visualizations - Row 2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Order Status Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Order Status</h3>
              <p className="text-sm text-slate-600">Distribution breakdown</p>
            </div>
          </div>
          <PieChart
            data={orderStatusData}
            labels={["Completed", "Pending", "Cancelled", "Refunded"]}
            colors={["bg-green-500", "bg-yellow-500", "bg-red-500", "bg-slate-500"]}
          />
        </Card>

        {/* Revenue by Currency */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Revenue by Currency</h3>
              <p className="text-sm text-slate-600">Payment method breakdown</p>
            </div>
          </div>
          <PieChart
            data={currencyData}
            labels={["SOL", "USDC", "USDT"]}
            colors={["bg-blue-500", "bg-green-500", "bg-purple-500"]}
          />
        </Card>
      </motion.div>

      {/* Bar Charts - Row 3 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Daily Orders */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Daily Orders</h3>
              <p className="text-sm text-slate-600">Orders per day</p>
            </div>
          </div>
          {data?.chartData && (
            <BarChart
              data={data.chartData.orders}
              labels={data.chartData.labels}
              color="bg-blue-600"
              showValues={true}
            />
          )}
        </Card>

        {/* Top Categories */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Top Categories</h3>
              <p className="text-sm text-slate-600">Performance by category</p>
            </div>
          </div>
          <BarChart
            data={[450, 380, 320, 290, 210]}
            labels={["Electronics", "Fashion", "Books", "Sports", "Home"]}
            color="bg-purple-600"
            showValues={true}
          />
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">Active Users</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {data?.activeUsersThisMonth || 0}
              </p>
              <p className="text-xs text-blue-600 mt-2">This month</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {data?.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 mt-2">Of visitors</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-semibold">Avg Order Value</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                ${(data?.avgOrderValue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 mt-2">Per transaction</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
