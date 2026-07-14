"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type PAJTransaction = {
  id: string;
  userId: string;
  userName: string;
  type: "onramp" | "offramp";
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fiatAmount: number;
  cryptoAmount: number;
  amount: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
};

type PAJData = {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  typeBreakdown?: {
    onramp: number;
    offramp: number;
  };
  transactions: PAJTransaction[];
};

export default function PAJTransactionsPage() {
  const [data, setData] = useState<PAJData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [flowFilter, setFlowFilter] = useState<"all" | "onramp" | "offramp">("all");

  useEffect(() => {
    fetchPAJTransactions();
  }, [statusFilter, flowFilter]);

  async function fetchPAJTransactions() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/transactions/paj?status=${statusFilter}&flow=${flowFilter}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (error) {
      console.error("Failed to fetch PAJ transactions:", error);
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

  const getFlowBadge = (type: "onramp" | "offramp") => {
    if (type === "onramp") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <ArrowDownToLine className="w-3 h-3" />
          Deposit (Onramp)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <ArrowUpFromLine className="w-3 h-3" />
        Withdrawal (Offramp)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading PAJ transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-600" />
          PAJ Cash Transactions
        </h1>
        <p className="text-slate-600 mt-1">Track deposits (onramp) and withdrawals (offramp), currency movement, and full timing.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Transactions</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{data?.totalTransactions || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600 font-semibold">Completed</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{data?.completedTransactions || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-600 font-semibold">Pending</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">{data?.pendingTransactions || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <p className="text-sm text-red-600 font-semibold">Failed</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{data?.failedTransactions || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-500">
          <p className="text-sm text-emerald-600 font-semibold">Onramp</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">{data?.typeBreakdown?.onramp || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-amber-500">
          <p className="text-sm text-amber-600 font-semibold">Offramp</p>
          <p className="text-3xl font-bold text-amber-900 mt-2">{data?.typeBreakdown?.offramp || 0}</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 flex-wrap"
      >
        {(["all", "completed", "pending", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {status}
          </button>
        ))}

        {(["all", "onramp", "offramp"] as const).map((flow) => (
          <button
            key={flow}
            onClick={() => setFlowFilter(flow)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              flowFilter === flow
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {flow === "all" ? "All Flows" : flow === "onramp" ? "Deposit (Onramp)" : "Withdrawal (Offramp)"}
          </button>
        ))}
      </motion.div>

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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Currency Movement</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amounts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Timing</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions && data.transactions.length > 0 ? (
                  data.transactions.map((txn, index) => (
                    <tr
                      key={txn.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{txn.userName}</p>
                          <p className="text-xs text-slate-600">{txn.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{getFlowBadge(txn.type)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                          <span>{txn.fromCurrency}</span>
                          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                          <span>{txn.toCurrency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium text-slate-900">
                          {txn.fromAmount.toLocaleString()} {txn.fromCurrency}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {txn.toAmount.toLocaleString()} {txn.toCurrency}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(txn.status)}
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              txn.status
                            )}`}
                          >
                            {txn.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <p>{new Date(txn.createdAt).toLocaleString()}</p>
                        <p className="text-xs mt-1">
                          Updated: {new Date(txn.updatedAt).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">No ramp transactions found</p>
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
