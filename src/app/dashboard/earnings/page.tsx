"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    Wallet,
    TrendingUp,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface Earnings {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    platformFee: number;
    sellerShare: number;
    withdrawn: number;
    pendingWithdrawals: number;
    available: number;
    currency: string;
}

interface Withdrawal {
    id: string;
    amount: number;
    currency: string;
    status: string;
    requestedAt: string;
    completedAt?: string;
    transactionSignature?: string;
    orderCount: number;
}

export default function EarningsPage() {
    const wallet = useWallet();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<Earnings | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const address = wallet.connected && wallet.publicKey ? wallet.publicKey.toString() : null;

    useEffect(() => {
        if (address) {
            fetchData();
        }
    }, [address]);

    const fetchData = async () => {
        if (!address) return;

        try {
            // Fetch earnings
            const earningsRes = await fetch(`/api/seller/earnings?address=${address}`);
            if (earningsRes.ok) {
                const data = await earningsRes.json();
                setEarnings(data.earnings);
            }

            // Fetch withdrawal history
            const withdrawalsRes = await fetch(`/api/seller/withdrawals?address=${address}`);
            if (withdrawalsRes.ok) {
                const data = await withdrawalsRes.json();
                setWithdrawals(data.withdrawals);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Error", "Failed to load earnings data");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = async () => {
        if (!address || !withdrawAmount) return;

        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid Amount", "Please enter a valid amount");
            return;
        }

        if (!earnings || amount > earnings.available) {
            toast.error("Insufficient Balance", "Amount exceeds available balance");
            return;
        }

        setWithdrawing(true);

        try {
            const res = await fetch("/api/seller/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    amount,
                    currency: earnings.currency,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Withdrawal Requested", "Your withdrawal will be processed within 24-48 hours");
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                fetchData(); // Refresh data
            } else {
                toast.error("Withdrawal Failed", data.error || "Please try again");
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("Error", "Failed to submit withdrawal request");
        } finally {
            setWithdrawing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "processing":
                return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
            case "rejected":
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-yellow-100 text-yellow-800";
        }
    };

    if (!wallet.connected) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <Wallet className="w-16 h-16 text-primary-blue mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-black mb-2">Connect Wallet</h2>
                    <p className="text-muted-text">Please connect your wallet to view earnings</p>
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
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-black mb-2">Earnings & Withdrawals</h1>
                    <p className="text-muted-text">Manage your seller earnings and request withdrawals</p>
                </div>

                {/* Earnings Overview */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-primary-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-black">Earnings Overview</h2>
                                <p className="text-sm text-muted-text">{earnings?.completedOrders || 0} completed orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-border-gray">
                                <span className="text-muted-text">Total Revenue</span>
                                <span className="font-semibold text-black">
                                    {earnings?.totalRevenue.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-border-gray">
                                <span className="text-muted-text">Platform Fee (5%)</span>
                                <span className="font-semibold text-red-600">
                                    -{earnings?.platformFee.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b-2 border-primary-blue">
                                <span className="font-medium text-black">Your Share (95%)</span>
                                <span className="font-bold text-primary-blue text-lg">
                                    {earnings?.sellerShare.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-border-gray">
                                <span className="text-muted-text">Already Withdrawn</span>
                                <span className="font-semibold text-muted-text">
                                    -{earnings?.withdrawn.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-border-gray">
                                <span className="text-muted-text">Pending Withdrawals</span>
                                <span className="font-semibold text-yellow-600">
                                    -{earnings?.pendingWithdrawals.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-600">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-900">Available to Withdraw</span>
                                </div>
                                <span className="font-bold text-green-600 text-xl">
                                    {earnings?.available.toFixed(4)} {earnings?.currency}
                                </span>
                            </div>
                        </div>
                    </div>

                    {earnings && earnings.available > 0 && (
                        <div className="mt-6 pt-6 border-t border-border-gray">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setWithdrawAmount(earnings.available.toString());
                                    setShowWithdrawModal(true);
                                }}
                                className="w-full md:w-auto"
                            >
                                <Wallet className="w-4 h-4 mr-2" />
                                Request Withdrawal
                            </Button>
                        </div>
                    )}

                    {earnings && earnings.available === 0 && (
                        <div className="mt-6 pt-6 border-t border-border-gray">
                            <div className="flex items-center gap-2 text-muted-text">
                                <AlertCircle className="w-5 h-5" />
                                <p className="text-sm">
                                    {earnings.pendingWithdrawals > 0
                                        ? "You have a pending withdrawal being processed"
                                        : "No funds available for withdrawal. Complete more orders to earn!"}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Withdrawal History */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-black mb-4">Withdrawal History</h2>

                    {withdrawals.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-16 h-16 text-muted-text mx-auto mb-4 opacity-50" />
                            <p className="text-muted-text">No withdrawal history yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-soft-gray-bg">
                                    <tr className="text-left text-sm text-muted-text">
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Orders</th>
                                        <th className="p-3">Requested</th>
                                        <th className="p-3">Completed</th>
                                        <th className="p-3">Transaction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-gray">
                                    {withdrawals.map((w) => (
                                        <tr key={w.id} className="hover:bg-soft-gray-bg">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(w.status)}
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(w.status)}`}>
                                                        {w.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 font-semibold">
                                                {w.amount.toFixed(4)} {w.currency}
                                            </td>
                                            <td className="p-3 text-muted-text">{w.orderCount}</td>
                                            <td className="p-3 text-sm text-muted-text">
                                                {new Date(w.requestedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-sm text-muted-text">
                                                {w.completedAt ? new Date(w.completedAt).toLocaleDateString() : "-"}
                                            </td>
                                            <td className="p-3">
                                                {w.transactionSignature ? (
                                                    <a
                                                        href={`https://explorer.solana.com/tx/${w.transactionSignature}?cluster=devnet`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-blue hover:underline text-sm"
                                                    >
                                                        View Tx
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-text text-sm">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Withdrawal Modal */}
                {showWithdrawModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-black mb-4">Request Withdrawal</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Amount ({earnings?.currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                        placeholder="0.0000"
                                    />
                                    <p className="text-xs text-muted-text mt-1">
                                        Available: {earnings?.available.toFixed(4)} {earnings?.currency}
                                    </p>
                                </div>

                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm space-y-1">
                                            <p className="font-medium text-yellow-900">Processing Time: 24-48 hours</p>
                                            <p className="text-yellow-700">
                                                Funds will be sent to your registered wallet: {address?.slice(0, 8)}...{address?.slice(-6)}
                                            </p>
                                            <p className="text-yellow-700">
                                                Withdrawals are processed 1-2 times per week
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="primary"
                                        onClick={handleWithdrawRequest}
                                        disabled={withdrawing}
                                        className="flex-1"
                                    >
                                        {withdrawing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Confirm Withdrawal"
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowWithdrawModal(false)}
                                        disabled={withdrawing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
