/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Calendar, Mail, TrendingUp, Loader2, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type UserData = {
  id: string;
  address: string;
  name?: string;
  school?: string;
  city?: string;
  country?: string;
  age_range?: string;
  signup_date: string;
  last_login?: string;
  total_orders: number;
  total_spent: number;
  points: number;
};

type UserAnalytics = {
  totalUsers: number;
  newUsersThisMonth: number;
  totalSpent: number;
  avgSpent: number;
  topCountries: Array<{ country: string; count: number }>;
  ageDistribution: Record<string, number>;
  users: UserData[];
};

export default function UsersAnalytics() {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUserAnalytics();
  }, [page]);

  async function fetchUserAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/users?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user analytics:", error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Users Analytics</h1>
          <p className="text-slate-600 mt-1">Detailed user demographics and behavior</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </motion.div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{data?.totalUsers || 0}</p>
                </div>
                <Users className="w-12 h-12 text-blue-100" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">New Users (Month)</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {data?.newUsersThisMonth || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-100" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Average Spent</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    ${(data?.avgSpent || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Top Countries</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {data?.topCountries?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">{item.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{
                          width: `${(item.count / (data.topCountries?.[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-slate-600 text-sm min-w-fit">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Age Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900">Age Distribution</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {data?.ageDistribution &&
                Object.entries(data.ageDistribution).map(([ageRange, count]) => (
                  <div key={ageRange} className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{ageRange}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{
                            width: `${
                              (count /
                                (Math.max(...Object.values(data.ageDistribution || {})) as number)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-600 text-sm min-w-fit">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Recent Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((user) => (
                  <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{user.name || "Unknown"}</p>
                        <p className="text-xs text-slate-600">{user.address?.slice(0, 10)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {user.city && user.country ? `${user.city}, ${user.country}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(user.signup_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {user.total_orders}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      ${user.total_spent?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{user.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
