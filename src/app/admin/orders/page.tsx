"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type Order = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  storeId: string;
  storeName: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  items: number;
  createdAt: string;
  updatedAt: string;
  payment_method: string;
  tx_signature: string;
};

type OrdersData = {
  orders: Order[];
  total: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
};

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "pending":
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  const baseClass = "px-3 py-1 text-xs font-semibold rounded-full";
  switch (status) {
    case "completed":
      return `${baseClass} bg-green-100 text-green-800`;
    case "pending":
      return `${baseClass} bg-yellow-100 text-yellow-800`;
    case "failed":
      return `${baseClass} bg-red-100 text-red-800`;
    default:
      return baseClass;
  }
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<"all" | "pending" | "completed" | "failed">("all");
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchQuery, status]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        status,
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading orders...</p>
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
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          Orders Management
        </h1>
        <p className="text-slate-600 mt-1">
          View and manage all orders across stores
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, user, or store..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Status Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 flex-wrap"
      >
        {(["all", "pending", "completed", "failed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              status === s
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ${(data?.totalRevenue || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {data?.completedOrders || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {data?.pendingOrders || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {data?.failedOrders || 0}
          </p>
        </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          {data?.orders && data.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-slate-200 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600">
                          {order.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {order.userName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {order.storeName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ${order.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-900">
                        {order.items}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={getStatusBadge(order.status)}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No orders found</p>
            </div>
          )}
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
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = currentPage > 3 ? currentPage - 2 + i : i + 1;
            return (
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
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100"
          >
            Next
          </button>
        </motion.div>
      )}
    </div>
  );
}
