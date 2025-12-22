"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    Users,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Loader2,
    Clock,
    CheckCircle,
    XCircle,
    Wallet,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface Stats {
    users: { total: number; newThisWeek: number };
    stores: { total: number };
    orders: { total: number; completed: number; pending: number };
    revenue: {
        gmv: number;
        platformFees: number;
        sellerRevenue: number;
        subscriptionRevenue: number;
        subscriptionRevenueSol: number;
        subscriptionRevenueUsdc: number;
        totalRevenue: number;
        currency: string;
    };
    withdrawals: {
        pending: number;
        processing: number;
        completed: number;
        totalPaidOut: number;
    };
}

interface Withdrawal {
    id: string;
    sellerAddress: string;
    sellerName: string;
    sellerEmail: string;
    amount: number;
    currency: string;
    orderCount: number;
    requestedAt: string;
    status: string;
}

interface User {
    address: string;
    name: string;
    email: string;
    school: string;
    campus: string;
    points: number;
    totalSpent: number;
    totalRevenue: number;
    storeCount: number;
    joinedAt: string;
}

interface Transaction {
    orderId: string;
    buyerAddress: string;
    amount: number;
    platformFee: number;
    sellerRevenue: number;
    currency: string;
    status: string;
    createdAt: string;
}

export default function AdminPage() {
    const wallet = useWallet();
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "withdrawals" | "users" | "transactions" | "earnings" | "subscriptions">("overview");

    const [stats, setStats] = useState<Stats | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [subscriptionStats, setSubscriptionStats] = useState<any>(null);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [txSignature, setTxSignature] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const address = wallet.connected && wallet.publicKey ? wallet.publicKey.toString() : null;

    useEffect(() => {
        if (address) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [address]);

    const fetchAllData = async () => {
        if (!address) return;
        setLoading(true);

        try {
            // Fetch stats
            const statsRes = await fetch(`/api/admin/stats?admin=${address}`);
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            } else if (statsRes.status === 401) {
                toast.error("Unauthorized", "You don't have admin access");
                router.push("/");
                return;
            }

            // Fetch pending withdrawals
            const withdrawalsRes = await fetch(`/api/admin/withdrawals?admin=${address}&status=pending`);
            if (withdrawalsRes.ok) {
                const data = await withdrawalsRes.json();
                setWithdrawals(data.withdrawals);
            }

            // Fetch users
            const usersRes = await fetch(`/api/admin/users?admin=${address}&sort=revenue&limit=20`);
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
            }

            // Fetch transactions
            const transactionsRes = await fetch(`/api/admin/transactions?admin=${address}&range=30&limit=50`);
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.transactions);
            }

            // Fetch subscriptions
            const subscriptionsRes = await fetch(`/api/admin/subscriptions?admin=${address}`);
            if (subscriptionsRes.ok) {
                const data = await subscriptionsRes.json();
                setSubscriptions(data.subscriptions);
                setSubscriptionStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            toast.error("Error", "Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    const handleProcessWithdrawal = async (action: "approve" | "reject") => {
        if (!address || !selectedWithdrawal) return;

        if (action === "approve" && !txSignature.trim()) {
            toast.error("Missing Information", "Please enter the transaction signature");
            return;
        }

        setProcessingId(selectedWithdrawal.id);

        try {
            const res = await fetch("/api/admin/process-withdrawal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    admin: address,
                    withdrawalId: selectedWithdrawal.id,
                    action,
                    transactionSignature: action === "approve" ? txSignature : undefined,
                    notes: action === "reject" ? rejectReason : undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(
                    action === "approve" ? "Withdrawal Approved" : "Withdrawal Rejected",
                    data.message
                );
                setShowProcessModal(false);
                setSelectedWithdrawal(null);
                setTxSignature("");
                setRejectReason("");
                fetchAllData(); // Refresh all data
            } else {
                toast.error("Processing Failed", data.error || "Please try again");
            }
        } catch (error) {
            console.error("Process withdrawal error:", error);
            toast.error("Error", "Failed to process withdrawal");
        } finally {
            setProcessingId(null);
        }
    };

    if (!wallet.connected) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-black mb-2">Admin Access Required</h2>
                    <p className="text-muted-text mb-4">Please connect your admin wallet to access the dashboard</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black mb-2">Admin Dashboard</h1>
                        <p className="text-muted-text">Platform management and analytics</p>
                    </div>
                    <Button variant="outline" onClick={fetchAllData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border-gray overflow-x-auto">
                    {[
                        { id: "overview", label: "Overview" },
                        { id: "withdrawals", label: "Withdrawals", badge: stats?.withdrawals.pending },
                        { id: "earnings", label: "Earnings" },
                        { id: "users", label: "Users" },
                        { id: "transactions", label: "Transactions" },
                        { id: "subscriptions", label: "Subscriptions", badge: subscriptionStats?.active },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === tab.id
                                ? "text-primary-blue border-b-2 border-primary-blue"
                                : "text-muted-text hover:text-black"
                                }`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && stats && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-black">{stats.users.total}</h3>
                                <p className="text-sm text-muted-text">Total Users</p>
                                <p className="text-xs text-green-600 mt-1">+{stats.users.newThisWeek} this week</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify<br/> between mb-4">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-black">{stats.revenue.gmv.toFixed(2)}</h3>
                                <p className="text-sm text-muted-text">Total GMV (SOL)</p>
                                <p className="text-xs text-muted-text mt-1">Platform fees: {stats.revenue.platformFees.toFixed(4)}</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-black">{stats.orders.total}</h3>
                                <p className="text-sm text-muted-text">Total Orders</p>
                                <p className="text-xs text-muted-text mt-1">{stats.orders.completed} completed</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <Wallet className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-black">{stats.withdrawals.pending}</h3>
                                <p className="text-sm text-muted-text">Pending Withdrawals</p>
                                <p className="text-xs text-muted-text mt-1">{stats.withdrawals.totalPaidOut.toFixed(2)} SOL paid out</p>
                            </Card>
                        </div>

                        {/* Quick Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-black mb-4">Platform Revenue</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Gross Merchandise Value</span>
                                        <span className="font-semibold">{stats.revenue.gmv.toFixed(4)} SOL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Platform Fees (5%)</span>
                                        <span className="font-semibold text-green-600">{stats.revenue.platformFees.toFixed(4)} SOL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Seller Revenue (95%)</span>
                                        <span className="font-semibold">{stats.revenue.sellerRevenue.toFixed(4)} SOL</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-black mb-4">Withdrawals</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Pending</span>
                                        <span className="font-semibold text-yellow-600">{stats.withdrawals.pending}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Processing</span>
                                        <span className="font-semibold text-blue-600">{stats.withdrawals.processing}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Completed</span>
                                        <span className="font-semibold text-green-600">{stats.withdrawals.completed}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Withdrawals Tab */}
                {activeTab === "withdrawals" && (
                    <div className="space-y-4">
                        {withdrawals.length === 0 ? (
                            <Card className="p-12 text-center">
                                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-black mb-2">All Caught Up!</h3>
                                <p className="text-muted-text">No pending withdrawal requests</p>
                            </Card>
                        ) : (
                            withdrawals.map((w) => (
                                <Card key={w.id} className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-yellow-100 rounded">
                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-black">{w.sellerName}</h4>
                                                    <p className="text-sm text-muted-text">{w.sellerEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-text">Amount: </span>
                                                    <span className="font-semibold text-green-600">{w.amount.toFixed(4)} {w.currency}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-text">Orders: </span>
                                                    <span className="font-semibold">{w.orderCount}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-text">Requested: </span>
                                                    <span className="font-semibold">{new Date(w.requestedAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-text">
                                                Seller: {w.sellerAddress.slice(0, 8)}...{w.sellerAddress.slice(-6)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    setSelectedWithdrawal(w);
                                                    setShowProcessModal(true);
                                                }}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Process
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Earnings Tab */}
                {activeTab === "earnings" && stats && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-black mb-6">Platform Earnings Breakdown</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* SOL */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-purple-600 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        SOL Revenue
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-muted-text">Gross Merchandise Value</span>
                                            <span className="font-semibold">{stats.revenue.gmv.toFixed(4)} SOL</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-muted-text">Platform Fees (5%)</span>
                                            <span className="font-bold text-green-600">{stats.revenue.platformFees.toFixed(4)} SOL</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-muted-text">Seller Share (95%)</span>
                                            <span className="font-semibold">{stats.revenue.sellerRevenue.toFixed(4)} SOL</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b bg-blue-50 p-2 rounded">
                                            <span className="text-muted-text font-medium">Subscription Revenue</span>
                                            <span className="font-bold text-blue-600">{(stats.revenue.subscriptionRevenue || 0).toFixed(4)} SOL</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-muted-text">Paid to Sellers</span>
                                            <span className="font-semibold text-red-600">-{stats.withdrawals.totalPaidOut.toFixed(4)} SOL</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                                            <span className="font-medium">Platform Balance</span>
                                            <span className="font-bold text-green-600">
                                                {((stats.revenue.platformFees || 0) + (stats.revenue.subscriptionRevenue || 0) + (stats.revenue.sellerRevenue || 0) - stats.withdrawals.totalPaidOut).toFixed(4)} SOL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* USDC */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        USDC Revenue
                                    </h4>
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <p className="text-muted-text text-sm">
                                            USDC transactions will appear here once users start paying with USDC
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid md:grid-cols-4 gap-4">
                            <Card className="p-6">
                                <h4 className="text-sm font-medium text-muted-text mb-2">Product Sales Fees</h4>
                                <p className="text-2xl font-bold text-green-600">{stats.revenue.platformFees.toFixed(4)} SOL</p>
                                <p className="text-xs text-muted-text mt-1">5% of all product sales</p>
                            </Card>

                            <Card className="p-6 bg-blue-50">
                                <h4 className="text-sm font-medium text-blue-700 mb-2">Subscription Revenue</h4>
                                <p className="text-2xl font-bold text-blue-600">{(stats.revenue.subscriptionRevenue || 0).toFixed(4)} SOL</p>
                                <p className="text-xs text-muted-text mt-1">Premium & Enterprise plans</p>
                            </Card>

                            <Card className="p-6">
                                <h4 className="text-sm font-medium text-muted-text mb-2">Total Seller Payments</h4>
                                <p className="text-2xl font-bold text-orange-600">{stats.withdrawals.totalPaidOut.toFixed(4)} SOL</p>
                                <p className="text-xs text-muted-text mt-1">{stats.withdrawals.completed} withdrawals</p>
                            </Card>

                            <Card className="p-6">
                                <h4 className="text-sm font-medium text-muted-text mb-2">Platform Wallet Balance</h4>
                                <p className="text-2xl font-bold text-purple-600">
                                    {(stats.revenue.gmv - stats.withdrawals.totalPaidOut).toFixed(4)} SOL
                                </p>
                                <p className="text-xs text-muted-text mt-1">Held in escrow</p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Subscriptions Tab */}
                {activeTab === "subscriptions" && (
                    <div className="space-y-6">
                        {/* Subscription Stats */}
                        {subscriptionStats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="p-6">
                                    <h4 className="text-sm font-medium text-muted-text mb-2">Total Subscriptions</h4>
                                    <p className="text-2xl font-bold text-black">{subscriptionStats.total}</p>
                                </Card>
                                <Card className="p-6 bg-green-50">
                                    <h4 className="text-sm font-medium text-green-700 mb-2">Active</h4>
                                    <p className="text-2xl font-bold text-green-600">{subscriptionStats.active}</p>
                                </Card>
                                <Card className="p-6">
                                    <h4 className="text-sm font-medium text-muted-text mb-2">Premium Tier</h4>
                                    <p className="text-2xl font-bold text-purple-600">{subscriptionStats.premium}</p>
                                </Card>
                                <Card className="p-6">
                                    <h4 className="text-sm font-medium text-muted-text mb-2">Pro Plus Tier</h4>
                                    <p className="text-2xl font-bold text-blue-600">{subscriptionStats.proPlus}</p>
                                </Card>
                            </div>
                        )}

                        {/* Subscriptions Table */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-black mb-4">All Subscriptions</h3>
                            {subscriptions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-muted-text mx-auto mb-4 opacity-50" />
                                    <p className="text-muted-text">No subscriptions yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-soft-gray-bg">
                                            <tr className="text-left text-sm text-muted-text">
                                                <th className="p-3">User</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3">Tier</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Start Date</th>
                                                <th className="p-3">End Date</th>
                                                <th className="p-3">Auto-Renew</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-gray">
                                            {subscriptions.map((sub: any) => (
                                                <tr key={sub.id} className="hover:bg-soft-gray-bg">
                                                    <td className="p-3 font-medium text-black">{sub.userName}</td>
                                                    <td className="p-3 text-sm text-muted-text">{sub.userEmail}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${sub.tier === 'premium'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {sub.tier === 'premium' ? 'Premium' : 'Pro Plus'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${sub.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-text">
                                                        {new Date(sub.startDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 text-sm text-muted-text">
                                                        {new Date(sub.endDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3">
                                                        {sub.autoRenew ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-black mb-4">Top Users</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-soft-gray-bg">
                                    <tr className="text-left text-sm text-muted-text">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Revenue (Seller)</th>
                                        <th className="p-3">Spent (Buyer)</th>
                                        <th className="p-3">Points</th>
                                        <th className="p-3">Stores</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-gray">
                                    {users.map((user) => (
                                        <tr key={user.address} className="hover:bg-soft-gray-bg">
                                            <td className="p-3 font-medium text-black">{user.name}</td>
                                            <td className="p-3 text-sm text-muted-text">{user.email}</td>
                                            <td className="p-3 font-semibold text-green-600">{user.totalRevenue.toFixed(2)} SOL</td>
                                            <td className="p-3 font-semibold">{user.totalSpent.toFixed(2)} SOL</td>
                                            <td className="p-3">{user.points}</td>
                                            <td className="p-3">{user.storeCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-black mb-4">Recent Transactions (Last 30 Days)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-soft-gray-bg">
                                    <tr className="text-left text-sm text-muted-text">
                                        <th className="p-3">Order ID</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Platform Fee</th>
                                        <th className="p-3">Seller Gets</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-gray">
                                    {transactions.map((tx) => (
                                        <tr key={tx.orderId} className="hover:bg-soft-gray-bg">
                                            <td className="p-3 text-xs font-mono">{tx.orderId.slice(0, 8)}</td>
                                            <td className="p-3 font-semibold">{tx.amount.toFixed(4)} {tx.currency}</td>
                                            <td className="p-3 text-green-600">{tx.platformFee.toFixed(4)}</td>
                                            <td className="p-3">{tx.sellerRevenue.toFixed(4)}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${tx.status === "completed"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-muted-text">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Process Withdrawal Modal */}
                {showProcessModal && selectedWithdrawal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-lg w-full p-6">
                            <h3 className="text-xl font-bold text-black mb-4">Process Withdrawal</h3>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-text">Seller:</span>
                                            <span className="font-semibold">{selectedWithdrawal.sellerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-text">Amount:</span>
                                            <span className="font-bold text-green-600">
                                                {selectedWithdrawal.amount.toFixed(4)} {selectedWithdrawal.currency}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-text">Orders:</span>
                                            <span className="font-semibold">{selectedWithdrawal.orderCount}</span>
                                        </div>
                                        <div className="text-xs text-muted-text mt-2">
                                            Wallet: {selectedWithdrawal.sellerAddress}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Transaction Signature (After Sending SOL)
                                    </label>
                                    <input
                                        type="text"
                                        value={txSignature}
                                        onChange={(e) => setTxSignature(e.target.value)}
                                        className="w-full px-4 py-2 border border-border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                        placeholder="Enter transaction signature..."
                                    />
                                    <p className="text-xs text-muted-text mt-1">
                                        Send {selectedWithdrawal.amount.toFixed(4)} SOL to the seller's wallet, then paste the transaction signature here
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Rejection Reason (Optional)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="w-full px-4 py-2 border border-border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                        placeholder="Reason for rejection..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    onClick={() => handleProcessWithdrawal("approve")}
                                    disabled={!!processingId || !txSignature.trim()}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {processingId ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleProcessWithdrawal("reject")}
                                    disabled={!!processingId}
                                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowProcessModal(false);
                                        setSelectedWithdrawal(null);
                                        setTxSignature("");
                                        setRejectReason("");
                                    }}
                                    disabled={!!processingId}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
