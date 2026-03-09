/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import {
    Loader2,
    DollarSign,
    ShoppingCart,
    Users,
    Wallet,
    CheckCircle,
    XCircle,
    RefreshCw,
    AlertTriangle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Shield,
    CreditCard,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Medal,
    Mail,
    Bell
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function AdminDashboard() {
    const router = useRouter();
    const { walletAddress, user, isLoading: walletLoading, isAuthenticated } = useCivicWallet();
    const toast = useToast();
    const [accessCode, setAccessCode] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "withdrawals" | "earnings" | "users" | "transactions" | "subscriptions" | "paj">("overview");

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersPage, setUsersPage] = useState(1);
    const [usersLoading, setUsersLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [pajTransactions, setPajTransactions] = useState<any[]>([]);

    // Process Withdrawal State
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [txSignature, setTxSignature] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Paj Verification State
    const [verificationCode, setVerificationCode] = useState("");
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    const usersLimit = 10;

    // --- Admin Access Verification ---
    useEffect(() => {
        // Check session storage for verification to persist across reloads
        const storedAuth = sessionStorage.getItem("admin_verified");
        if (storedAuth === "true") {
            setIsVerified(true);
        }
    }, []);

    useEffect(() => {
        if (isVerified && walletAddress) {
            fetchAllData();
        }
    }, [isVerified, walletAddress]);

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side check for demo purposes. 
        // In production, this should validate against a server endpoint or env var.
        const validCode = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE || "202425"; // Default fallback
        
        if (accessCode === validCode) {
            setIsVerified(true);
            sessionStorage.setItem("admin_verified", "true");
            toast.success("Access Granted", "Welcome to the Admin Dashboard");
        } else {
            toast.error("Access Denied", "Invalid access code");
        }
    };

    // --- Data Fetching ---
    const fetchAllData = async () => {
        if (!walletAddress) return;
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchWithdrawals(),
                fetchUsers(1),
                fetchTransactions(),
                fetchSubscriptions(),
                fetchPajTransactions()
            ]);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            toast.error("Error", "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/admin/stats?admin=${walletAddress}`);
            const data = await res.json();
            if (res.ok) setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch(`/api/admin/withdrawals?admin=${walletAddress}&status=pending`);
            const data = await res.json();
            if (res.ok) setWithdrawals(data.withdrawals || []);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
        }
    };

    const fetchUsers = async (page: number) => {
        setUsersLoading(true);
        try {
            const res = await fetch(`/api/admin/users?admin=${walletAddress}&page=${page}&limit=${usersLimit}`);
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users || []);
                setUsersTotal(data.total || 0);
                setUsersPage(page);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`/api/admin/transactions?admin=${walletAddress}&limit=20`);
            const data = await res.json();
            if (res.ok) setTransactions(data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch(`/api/admin/subscriptions?admin=${walletAddress}`);
            const data = await res.json();
            if (res.ok) {
                setSubscriptionStats(data.stats);
                setSubscriptions(data.subscriptions || []);
            }
        } catch (error) {
            console.error("Failed to fetch subscriptions:", error);
        }
    };

    const fetchPajTransactions = async () => {
        try {
            const res = await fetch(`/api/admin/ramp-transactions?limit=20`);
            const data = await res.json();
            if (res.ok) setPajTransactions(data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch paj transactions:", error);
        }
    };

    // --- Actions ---
    const handleProcessWithdrawal = async (action: "approve" | "reject") => {
        if (!selectedWithdrawal || !walletAddress) return;

        if (action === "approve" && !txSignature.trim()) {
            toast.error("Missing Signature", "Please enter the transaction signature");
            return;
        }

        setProcessingId(selectedWithdrawal.id);
        try {
            const res = await fetch("/api/admin/process-withdrawal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    admin: walletAddress,
                    withdrawalId: selectedWithdrawal.id,
                    action,
                    txSignature: action === "approve" ? txSignature : undefined,
                    reason: action === "reject" ? rejectReason : undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Success", `Withdrawal ${action}ed successfully`);
                setShowProcessModal(false);
                setSelectedWithdrawal(null);
                setTxSignature("");
                setRejectReason("");
                fetchWithdrawals();
                fetchStats();
            } else {
                toast.error("Error", data.error || "Failed to process withdrawal");
            }
        } catch (error) {
            console.error("Process withdrawal error:", error);
            toast.error("Error", "Failed to process request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerifyPaj = async () => {
        if (!verificationCode) return;
        setVerifying(true);
        setVerificationError(null);
        setVerificationResult(null);

        try {
            const res = await fetch("/api/admin/ramp-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference: verificationCode })
            });
            const data = await res.json();
            
            if (res.ok) {
                setVerificationResult(data.data);
            } else {
                setVerificationError(data.error || "Verification failed");
            }
        } catch (err) {
            setVerificationError("Network error occurred");
        } finally {
            setVerifying(false);
        }
    };

    // --- Render Logic ---

    if (walletLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
                        <p className="text-slate-500 mt-2">Enter your secure access code to continue</p>
                    </div>

                    <form onSubmit={handleAccessSubmit} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 text-center text-lg tracking-widest"
                                placeholder="••••••"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-600/20"
                        >
                            Verify Access
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Top Navigation */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                            A
                        </div>
                        <span className="font-bold text-slate-900 hidden sm:block">StudIQ Admin</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center px-3 py-1.5 bg-green-50 rounded-full text-xs font-medium text-green-700 border border-green-100">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            System Operational
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchAllData} className="text-slate-600 hover:text-blue-600">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            AD
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                        <p className="text-slate-500 mt-1">Manage users, transactions, and system health.</p>
                    </div>
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200 overflow-x-auto">
                        {[
                            { id: "overview", label: "Overview", icon: LayoutDashboard },
                            { id: "withdrawals", label: "Withdrawals", icon: Wallet },
                            { id: "subscriptions", label: "Subscriptions", icon: Sparkles },
                            { id: "users", label: "Users", icon: Users },
                            { id: "paj", label: "PAJ Ramp", icon: CreditCard },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    {activeTab === "overview" && stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <TrendingUp className="w-3 h-3 mr-1" /> +{stats.users.newThisWeek}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.users.total.toLocaleString()}</h3>
                                    <p className="text-sm text-slate-500">Total Users</p>
                                </Card>

                                <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-1">${stats.revenue.gmvUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                    <p className="text-sm text-slate-500">Total GMV (USD)</p>
                                </Card>

                                <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                            <ShoppingCart className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                            {stats.orders.completed} completed
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.orders.total.toLocaleString()}</h3>
                                    <p className="text-sm text-slate-500">Total Orders</p>
                                </Card>

                                <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.withdrawals.pending}</h3>
                                    <p className="text-sm text-slate-500">Pending Withdrawals</p>
                                </Card>
                            </div>

                            {/* Recent Transactions Table */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Platform Fee</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.slice(0, 5).map((tx: any) => (
                                                <tr key={tx.orderId} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-mono text-sm text-slate-600">#{tx.orderId.slice(0, 8)}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">{tx.amount.toFixed(2)} {tx.currency}</td>
                                                    <td className="px-6 py-4 text-green-600 font-medium">+{tx.platformFee.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "withdrawals" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900">Pending Withdrawals</h3>
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                                    {withdrawals.length} Pending
                                </span>
                            </div>
                            
                            {withdrawals.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">All Caught Up!</h3>
                                    <p className="text-slate-500">No pending withdrawal requests.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {withdrawals.map((w) => (
                                        <div key={w.id} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                                                        <Clock className="w-5 h-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{w.sellerName}</h4>
                                                        <p className="text-sm text-slate-500 mb-2">{w.sellerEmail}</p>
                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 font-mono">
                                                                {w.sellerAddress.slice(0, 6)}...{w.sellerAddress.slice(-4)}
                                                            </span>
                                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">
                                                                {new Date(w.requestedAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-slate-900">{w.amount.toFixed(4)} <span className="text-sm text-slate-500 font-medium">{w.currency}</span></p>
                                                        <p className="text-xs text-slate-500">{w.orderCount} orders</p>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => {
                                                            setSelectedWithdrawal(w);
                                                            setShowProcessModal(true);
                                                        }}
                                                        className="bg-slate-900 hover:bg-slate-800"
                                                    >
                                                        Process
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "subscriptions" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {subscriptionStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="p-5 border-slate-100 bg-white shadow-sm text-center">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-2xl font-bold text-slate-900">{subscriptionStats.total}</p>
                                    </Card>
                                    <Card className="p-5 border-green-100 bg-green-50 shadow-sm text-center">
                                        <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Active</p>
                                        <p className="text-2xl font-bold text-green-700">{subscriptionStats.active}</p>
                                    </Card>
                                    <Card className="p-5 border-purple-100 bg-purple-50 shadow-sm text-center">
                                        <p className="text-xs font-medium text-purple-700 uppercase tracking-wider mb-1">Premium</p>
                                        <p className="text-2xl font-bold text-purple-700">{subscriptionStats.premium}</p>
                                    </Card>
                                    <Card className="p-5 border-blue-100 bg-blue-50 shadow-sm text-center">
                                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">Pro Plus</p>
                                        <p className="text-2xl font-bold text-blue-700">{subscriptionStats.proPlus}</p>
                                    </Card>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900">Subscribers</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Plan</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Expires</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {subscriptions.map((sub: any) => (
                                                <tr key={sub.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{sub.userName}</div>
                                                        <div className="text-sm text-slate-500">{sub.userEmail}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            sub.tier === 'premium' ? 'bg-purple-100 text-purple-800' : 
                                                            sub.tier === 'enterprise' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                            {sub.tier === 'premium' ? <Sparkles className="w-3 h-3 mr-1" /> : <Medal className="w-3 h-3 mr-1" />}
                                                            {sub.tier}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(sub.endDate).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "users" && (
                         <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900">User Management</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => fetchUsers(Math.max(1, usersPage - 1))} disabled={usersPage <= 1}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="px-4 py-2 text-sm text-slate-600">Page {usersPage}</span>
                                    <Button variant="outline" size="sm" onClick={() => fetchUsers(usersPage + 1)} disabled={usersTotal <= usersPage * usersLimit}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Spent</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map((u: any) => (
                                            <tr key={u.address} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{u.name || "Anonymous"}</div>
                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-green-600">${u.totalRevenue?.toFixed(2) || '0.00'}</td>
                                                <td className="px-6 py-4 text-slate-900">${u.totalSpent?.toFixed(2) || '0.00'}</td>
                                                <td className="px-6 py-4 text-slate-600">{u.points || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "paj" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Verify Transaction</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="Enter transaction reference..."
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <Button onClick={handleVerifyPaj} disabled={verifying || !verificationCode}>
                                        {verifying ? "Verifying..." : "Verify"}
                                    </Button>
                                </div>
                                {verificationResult && (
                                    <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
                                        <pre className="text-xs overflow-auto">{JSON.stringify(verificationResult, null, 2)}</pre>
                                    </div>
                                )}
                                {verificationError && (
                                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                                        {verificationError}
                                    </div>
                                )}
                            </div>

                             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900">PAJ Ramp Transactions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ref</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pajTransactions.map((tx: any) => (
                                                <tr key={tx.reference} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-mono text-xs">{tx.reference}</td>
                                                    <td className="px-6 py-4">{tx.amount} {tx.currency}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            tx.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Process Withdrawal Modal */}
                {showProcessModal && selectedWithdrawal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900">Process Withdrawal</h3>
                                <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Seller</span>
                                        <span className="font-medium text-slate-900">{selectedWithdrawal.sellerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Amount</span>
                                        <span className="font-bold text-slate-900">{selectedWithdrawal.amount.toFixed(4)} {selectedWithdrawal.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Wallet</span>
                                        <span className="font-mono text-xs text-slate-600">{selectedWithdrawal.sellerAddress}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Signature (Hash)</label>
                                    <input
                                        type="text"
                                        value={txSignature}
                                        onChange={(e) => setTxSignature(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder="Enter Solana transaction signature..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        onClick={() => handleProcessWithdrawal("reject")}
                                        variant="outline"
                                        className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                                        disabled={!!processingId}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleProcessWithdrawal("approve")}
                                        variant="primary"
                                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                                        disabled={!!processingId || !txSignature}
                                    >
                                        {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transfer"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
