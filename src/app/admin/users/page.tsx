"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  AlertCircle,
  Search,
  MapPin,
  Smartphone,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type User = {
  id: string;
  email: string;
  name: string;
  wallet_address: string;
  total_spent: number;
  total_orders: number;
  last_purchase: string | null;
  city: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  signup_date: string;
  last_login: string | null;
  is_seller: boolean;
  avg_order_value: number;
  spending_trend: number;
};

type UsersData = {
  users: User[];
  total: number;
};

export default function UsersPage() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "buyers" | "sellers">(
    "all"
  );
  const itemsPerPage = 15;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, filterType]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        type: filterType,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Users Management
        </h1>
        <p className="text-slate-600 mt-1">
          View user profiles, spending patterns, and device information
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or wallet..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "buyers", "sellers"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {data?.total || 0}
          </p>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    User
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.users && data.users.length > 0 ? (
                  data.users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-600">{user.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {user.is_seller && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-semibold">
                                Seller
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {user.city || "Unknown"}, {user.country || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Smartphone className="w-4 h-4" />
                          <span className="text-xs">
                            {user.device_type || "Unknown"} • {user.browser || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-slate-900">
                            {user.total_orders}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-slate-900">
                            ${user.total_spent.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-2"
        >
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = currentPage - 2 + i;
            return page > 0 && page <= totalPages ? (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ) : null;
          })}
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </motion.div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedUser.name}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Wallet Address</p>
                    <p className="font-medium text-slate-900 break-all text-xs">
                      {selectedUser.wallet_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Joined</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedUser.signup_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Last Login</p>
                    <p className="font-medium text-slate-900">
                      {selectedUser.last_login
                        ? new Date(selectedUser.last_login).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Device Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Location & Device
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="font-medium text-slate-900">
                      {selectedUser.city}, {selectedUser.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Device Type</p>
                    <p className="font-medium text-slate-900">
                      {selectedUser.device_type || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Browser</p>
                    <p className="font-medium text-slate-900">
                      {selectedUser.browser || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spending Patterns */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Spending Patterns
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-700">Total Spent</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      ${selectedUser.total_spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {selectedUser.total_orders}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-purple-700">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      ${selectedUser.avg_order_value.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-600">Spending Trend</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          selectedUser.spending_trend > 0
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.abs(selectedUser.spending_trend)
                          )}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        selectedUser.spending_trend > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedUser.spending_trend > 0 ? "+" : ""}
                      {selectedUser.spending_trend}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Account Status
                </h3>
                <div className="flex items-center gap-4">
                  {selectedUser.is_seller && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                      Seller Account
                    </span>
                  )}
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
