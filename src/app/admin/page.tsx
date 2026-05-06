/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Loader2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import Link from "next/link";

type DashboardOverview = {
  totalStores: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  featuredStores: number;
  activeOrders: number;
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      // Fetch overview data
      const [storesRes, usersRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/stores"),
        fetch("/api/admin/analytics/users"),
        fetch("/api/admin/analytics"),
      ]);

      if (storesRes.ok && usersRes.ok && analyticsRes.ok) {
        const storesData = await storesRes.json();
        const usersData = await usersRes.json();
        const analyticsData = await analyticsRes.json();

        const featuredCount = storesData.stores?.filter((s: any) => s.featured).length || 0;

        setData({
          totalStores: storesData.stores?.length || 0,
          totalUsers: usersData.totalUsers || 0,
          totalOrders: analyticsData.totalOrders || 0,
          totalRevenue: analyticsData.totalRevenue || 0,
          featuredStores: featuredCount,
          activeOrders: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const quickStats = [
    {
      label: "Total Stores",
      value: data?.totalStores || 0,
      icon: LayoutDashboard,
      color: "blue",
      href: "/admin/stores",
    },
    {
      label: "Total Users",
      value: data?.totalUsers || 0,
      icon: Users,
      color: "green",
      href: "/admin/users",
    },
    {
      label: "Total Orders",
      value: data?.totalOrders || 0,
      icon: ShoppingCart,
      color: "purple",
      href: "/admin/orders",
    },
    {
      label: "Total Revenue",
      value: `$${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "orange",
      href: "/admin/analytics/revenue",
    },
    {
      label: "Featured Stores",
      value: data?.featuredStores || 0,
      icon: Star,
      color: "yellow",
      href: "/admin/featured-stores",
    },
    {
      label: "Growth",
      value: "↑ 12%",
      icon: TrendingUp,
      color: "pink",
      href: "/admin/analytics",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-yellow-50 text-yellow-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white"
      >
        <h1 className="text-4xl font-bold mb-2">Welcome to StudIQ Admin</h1>
        <p className="text-blue-100">
          Manage your platform, analytics, and featured stores all in one place
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            const bgColor = colorClasses[stat.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={stat.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${bgColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/featured-stores">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group p-6 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-200 rounded-lg group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-yellow-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Manage Featured Stores</h3>
                  <p className="text-sm text-slate-600">Select and order stores on landing page</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-200 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">View Analytics</h3>
                  <p className="text-sm text-slate-600">Deep dive into metrics and user behavior</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/analytics/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group p-6 bg-gradient-to-br from-green-50 to-green-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-200 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">User Demographics</h3>
                  <p className="text-sm text-slate-600">Location, age range, and signup trends</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/analytics/revenue">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group p-6 bg-gradient-to-br from-purple-50 to-purple-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-200 rounded-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Revenue Insights</h3>
                  <p className="text-sm text-slate-600">Track revenue by payment method</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

