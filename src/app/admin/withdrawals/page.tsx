"use client";

import { useState, useEffect } from "react";
import {
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type Withdrawal = {
  id: string;
  storeId: string;
  storeName: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  accountDetails: string;
  createdAt: string;
  updatedAt: string;
};

type WithdrawalsData = {
  totalWithdrawals: number;
  totalAmount: number;
  completedWithdrawals: number;
  pendingWithdrawals: number;
  failedWithdrawals: number;
  withdrawals: Withdrawal[];
};

export default function WithdrawalsPage() {
  const [data, setData] = useState<WithdrawalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  async function fetchWithdrawals() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/withdrawals?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
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
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading withdrawals...</p>
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
      >
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingDown className="w-8 h-8 text-red-600" />
          Store Withdrawals
        </h1>
        <p className="text-slate-600 mt-1">Track all store payout withdrawals</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Withdrawals</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {data?.totalWithdrawals || 0}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Total: ${(data?.totalAmount || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600 font-semibold">Completed</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {data?.completedWithdrawals || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-600 font-semibold">Pending</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">
            {data?.pendingWithdrawals || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <p className="text-sm text-red-600 font-semibold">Failed</p>
          <p className="text-3xl font-bold text-red-900 mt-2">
            {data?.failedWithdrawals || 0}
          </p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2"
      >
        {(["all", "completed", "pending", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === status
                ? "bg-red-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {status}
          </button>
        ))}
      </motion.div>

      {/* Withdrawals Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Method
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
                {data?.withdrawals && data.withdrawals.length > 0 ? (
                  data.withdrawals.map((withdrawal, index) => (
                    <tr
                      key={withdrawal.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">
                            {withdrawal.storeName}
                          </p>
                          <p className="text-xs text-slate-600">
                            {withdrawal.storeId}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        ${withdrawal.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {withdrawal.method}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              withdrawal.status
                            )}`}
                          >
                            {withdrawal.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">No withdrawals found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
