"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import LineChart from "@/components/analytics/LineChart";

type RevenueData = {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  revenueToday: number;
  growthRate: number;
  chartData: {
    labels: string[];
    revenue: number[];
  };
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  async function fetchRevenueData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/revenue?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

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
            <DollarSign className="w-8 h-8 text-green-600" />
            Revenue Analytics
          </h1>
          <p className="text-slate-600 mt-1">Detailed revenue insights and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Revenue Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ${(data?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-2">All time</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">This Month</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                ${(data?.revenueThisMonth || 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-green-600 mt-2 text-xs">
                <ArrowUp className="w-3 h-3" />
                <span>+{data?.growthRate || 0}%</span>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-semibold">This Week</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                ${(data?.revenueThisWeek || 0).toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-2">7 days</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700 font-semibold">Today</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                ${(data?.revenueToday || 0).toLocaleString()}
              </p>
              <p className="text-xs text-orange-600 mt-2">Daily average</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </Card>
      </motion.div>

      {/* Revenue Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-600">Revenue over time</p>
            </div>
            <div className="text-green-600 font-semibold">${(data?.revenueThisMonth || 0).toLocaleString()}</div>
          </div>
          {data?.chartData && (
            <LineChart
              labels={data.chartData.labels}
              data={data.chartData.revenue}
              color="rgb(34, 197, 94)"
              height={300}
            />
          )}
        </Card>
      </motion.div>

      {/* Payment Methods Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-6">Revenue by Payment Method</h3>
          <div className="space-y-4">
            {data?.paymentMethods &&
              data.paymentMethods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">{method.method}</p>
                      <p className="text-sm text-slate-600">
                        ${method.amount.toLocaleString()} ({method.percentage}%)
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          index === 0
                            ? "bg-blue-600"
                            : index === 1
                            ? "bg-green-600"
                            : "bg-purple-600"
                        }`}
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
