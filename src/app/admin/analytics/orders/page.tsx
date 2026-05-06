/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, TrendingUp, Clock, CheckCircle, Loader2, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function OrdersAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const orderStats = [
    { label: "Total Orders", value: "1,234", change: "+12% from last month" },
    { label: "Pending Orders", value: "23", change: "2 urgent" },
    { label: "Completed Orders", value: "1,150", change: "93% completion rate" },
    { label: "Avg Fulfillment Time", value: "2.4 days", change: "-0.3 days vs last month" },
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
          <h1 className="text-4xl font-bold text-slate-900">Orders Analytics</h1>
          <p className="text-slate-600 mt-1">Track order performance and fulfillment metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {orderStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="p-6">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                <p className="text-xs text-slate-600 mt-2">{stat.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Order Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Order Status Distribution</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Completed</span>
                <span className="text-sm font-semibold text-slate-900">1,150 (93%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: "93%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Processing</span>
                <span className="text-sm font-semibold text-slate-900">61 (5%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: "5%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Pending</span>
                <span className="text-sm font-semibold text-slate-900">23 (2%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600" style={{ width: "2%" }}></div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
