/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Loader2, Download, BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const revenueStats = [
    { label: "Total Revenue", value: "$45,231", change: "+22% from last month", icon: DollarSign },
    { label: "This Month", value: "$12,421", change: "+8% from last 30 days", icon: TrendingUp },
    { label: "This Week", value: "$3,421", change: "+15% from last week", icon: BarChart3 },
    { label: "Today", value: "$856", change: "Average daily revenue", icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Revenue Analytics</h1>
          <p className="text-slate-600 mt-1">Detailed revenue insights and trends</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-slate-600 mt-2">{stat.change}</p>
                    </div>
                    <Icon className="w-8 h-8 text-green-600/20" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Revenue by Payment Method</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">USDC/USDT (Stablecoin)</span>
                <span className="text-sm font-semibold text-slate-900">$28,500 (63%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: "63%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Pay on Delivery</span>
                <span className="text-sm font-semibold text-slate-900">$12,231 (27%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: "27%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">StudPoints</span>
                <span className="text-sm font-semibold text-slate-900">$4,500 (10%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
