/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import DashboardCard from "@/components/DashboardCard";
import { ShoppingBag, DollarSign, Award, TrendingUp, Loader2, BarChart3, RefreshCw, Wallet, Users, Copy, Link2 } from "lucide-react";
import ShareStoreButton from "@/components/ShareStoreButton";
import RevenueChart from "@/components/charts/RevenueChart";
import OrdersChart from "@/components/charts/OrdersChart";
import PointsChart from "@/components/charts/PointsChart";
import ActivityFeed from "@/components/ActivityFeed";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type DashboardStats = {
  totalOrders: number;
  revenue: number;
  revenueBreakdown?: { // Optional breakdown
    sol: number;
    usdc: number;
    usd: number;
  };
  currency: string;
  points: number;
  growth: number;
  recentActivity: any[];
  storeId?: string;
};

type AnalyticsData = {
  labels: string[];
  orders: number[];
  revenue: number[];
  points: number[];
};

type ReferralSummary = {
  referralCode: string;
  totalReferrals: number;
  referralPointsTotal?: number;
  referralPointsHistory?: { points: number; reason: string; created_at: string; referredAddress?: string | null; referredName?: string | null }[];
};

export default function DashboardPage() {
  const { walletAddress, user, email, isLoading: authLoading } = useCivicWallet();
  const [isBuyer, setIsBuyer] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  // Use walletAddress if available, otherwise use email as identifier
  const identifier = walletAddress || (email ? `email:${email}` : null);

  useEffect(() => {
    if (identifier) {
      fetchDashboardData();
    } else if (!authLoading && user) {
      // User is authenticated but no identifier yet, show empty state
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [identifier, authLoading, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!identifier) return;

    if (!silent) setLoading(true);
    setRefreshing(true);

    try {
      // Fetch stats - use identifier (could be wallet address or email:xxx)
      const statsRes = await fetch(`/api/dashboard/stats?address=${encodeURIComponent(identifier)}`);

      if (statsRes.status === 401) {
        console.warn("Dashboard stats: Unauthorized session. Session may have expired.");
        // We let the auth logic handle re-establishing session
        return;
      }

      const statsData = await statsRes.json();

      // Fetch analytics
      const analyticsRes = await fetch(`/api/dashboard/analytics?address=${encodeURIComponent(identifier)}&range=30`);

      if (analyticsRes.status === 401) {
        console.warn("Dashboard analytics: Unauthorized session.");
        return;
      }

      const analyticsData = await analyticsRes.json();

      if (statsData?.buyer && statsData?.seller) {
        setStats(isBuyer ? statsData.buyer : statsData.seller);
      }

      if (analyticsData?.labels && analyticsData?.buyer && analyticsData?.seller) {
        setAnalytics(isBuyer ? {
          labels: analyticsData.labels,
          orders: analyticsData.buyer.orders,
          revenue: analyticsData.buyer.revenue,
          points: analyticsData.points || []
        } : {
          labels: analyticsData.labels,
          orders: analyticsData.seller.orders,
          revenue: analyticsData.seller.revenue,
          points: analyticsData.points || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) {
      setReferralSummary(null);
      return;
    }

    const loadReferralSummary = async () => {
      setReferralLoading(true);
      try {
        const res = await fetch("/api/referrals/summary", { cache: "no-store" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load referrals");
        }
        const data = await res.json();
        setReferralSummary({
          referralCode: data.referralCode,
          totalReferrals: data.totalReferrals,
          referralPointsTotal: data.referralPointsTotal ?? 0,
          referralPointsHistory: data.referralPointsHistory ?? [],
        });
        setReferralError(null);
      } catch (err) {
        setReferralError(err instanceof Error ? err.message : "Failed to load referrals");
      } finally {
        setReferralLoading(false);
      }
    };

    loadReferralSummary();
  }, [walletAddress]);

  const referralLink = referralSummary?.referralCode && baseUrl
    ? `${baseUrl}/onboarding?ref=${encodeURIComponent(referralSummary.referralCode)}`
    : "";

  const handleCopy = async (value: string, type: "code" | "link") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setReferralError("Unable to copy to clipboard");
    }
  };

  const renderReferralBlocks = (code?: string) => {
    if (!code) {
      return <span className="text-sm text-muted-text">—</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        {code.split("").map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="inline-flex items-center justify-center w-7 h-8 rounded-md border border-border-gray bg-white text-sm font-semibold text-black"
          >
            {char}
          </span>
        ))}
      </div>
    );
  };
  const formatReferralReason = (row: { reason: string; referredAddress?: string | null; referredName?: string | null }) => {
    const name = row.referredName?.trim();
    const address = row.referredAddress || row.reason?.replace("Referral bonus - ", "");
    if (name) return `Referral bonus - ${name}`;
    if (address) return `Referral bonus - ${address.slice(0, 4)}...${address.slice(-4)}`;
    return row.reason;
  };

  // Re-fetch when toggling between buyer/seller
  useEffect(() => {
    if (walletAddress) {
      fetchDashboardData();
    }
  }, [isBuyer]);

  // Only check for user, not walletAddress (wallet may still be loading)
  if (!user) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center p-4">
        <div className="text-center glass-panel rounded-3xl p-8 border border-white/60">
          <h2 className="text-2xl font-bold text-black mb-4">Sign In Required</h2>
          <p className="text-lg text-muted-text mb-6">Please sign in to view your dashboard</p>
          <Button variant="primary" onClick={() => window.location.href = "/"}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 pt-0 pb-6 md:px-6 md:pt-1 md:pb-8 lg:px-8 lg:pt-2 lg:pb-10 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between glass-panel rounded-3xl p-5 sm:p-6"
        >
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-1 truncate">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-text">Welcome back! Here&apos;s your overview</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* View Toggle */}
            <div className="glass-pill rounded-2xl p-1 flex gap-1">
              <button
                onClick={() => setIsBuyer(true)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${isBuyer
                  ? 'bg-primary-blue text-white'
                  : 'text-muted-text hover:bg-white/70'
                  }`}
              >
                Buyer
              </button>
              <button
                onClick={() => setIsBuyer(false)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${!isBuyer
                  ? 'bg-primary-blue text-white'
                  : 'text-muted-text hover:bg-white/70'
                  }`}
              >
                Seller
              </button>
            </div>

            {/* Share Store Button (Seller Only) */}
            {!isBuyer && stats?.storeId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/store/${stats.storeId}`;
                  navigator.clipboard.writeText(url);
                  // Optional: You could add a temporary "Copied!" state here if you wanted to be fancy,
                  // but for now a toast or just simple feedback is fine. 
                  // Since we don't have toast imported here easily (need hook), let's just assume user knows.
                  // Actually, let's use a simple state for visual feedback.
                }}
                className="min-h-[44px]"
              >
                <ShareStoreButton storeId={stats.storeId} />
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-primary-blue/30 border-t-primary-blue animate-spin" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-white/80" />
                  <div className="h-3 w-24 rounded-full bg-white/70" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-pulse">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-card rounded-2xl border border-white/60 p-5">
                  <div className="h-3 w-24 rounded-full bg-white/70" />
                  <div className="mt-4 h-6 w-28 rounded-full bg-white/80" />
                  <div className="mt-3 h-3 w-16 rounded-full bg-white/60" />
                </div>
              ))}
            </div>
            <div className="glass-panel rounded-3xl p-6 animate-pulse">
              <div className="h-4 w-28 rounded-full bg-white/70" />
              <div className="mt-4 h-3 w-40 rounded-full bg-white/60" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="h-20 rounded-2xl bg-white/70" />
                <div className="h-20 rounded-2xl bg-white/70" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
            >
              <DashboardCard
                title={isBuyer ? "Total Purchases" : "Total Orders"}
                value={stats?.totalOrders.toString() || "0"}
                icon={ShoppingBag}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
              <DashboardCard
                title={isBuyer ? "Total Spent" : "Revenue"}
                value={`$${(stats?.revenue || 0).toFixed(2)}`}
                subtitle={
                  stats?.revenueBreakdown ? (
                    <div className="text-[10px] sm:text-xs text-muted-text mt-1 space-y-0.5">
                      {stats.revenueBreakdown.sol > 0 && <div>{stats.revenueBreakdown.sol} SOL</div>}
                      {stats.revenueBreakdown.usdc > 0 && <div>${stats.revenueBreakdown.usdc} USDC</div>}
                      {stats.revenueBreakdown.usd > 0 && <div>${stats.revenueBreakdown.usd} USD</div>}
                    </div>
                  ) : undefined
                }
                icon={DollarSign}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
              <DashboardCard
                title="Reward Points"
                value={(stats?.points || 0).toString()}
                icon={Award}
              />
              <DashboardCard
                title="Growth"
                value={`${stats?.growth?.toFixed(1) || 0}%`}
                icon={TrendingUp}
                trend={{
                  value: `${stats?.growth?.toFixed(1) || 0}%`,
                  isPositive: (stats?.growth || 0) >= 0
                }}
              />
            </motion.div>

            <Card className="p-6 border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/85 rounded-2xl border border-white/70">
                  <Users className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Referrals</h3>
                  <p className="text-sm text-muted-text">Share your link and track your referrals</p>
                </div>
              </div>

              {!walletAddress && (
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-muted-text">
                  Connect your wallet to view your referral details.
                </div>
              )}

              {walletAddress && (
                <div className="space-y-3">
                  {referralError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {referralError}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                      <div className="text-xs text-muted-text">Your referral code</div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    {referralLoading ? (
                      <span className="text-sm text-muted-text">Loading...</span>
                    ) : (
                      renderReferralBlocks(referralSummary?.referralCode)
                    )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(referralSummary?.referralCode || "", "code")}
                          disabled={referralLoading || !referralSummary?.referralCode}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copied === "code" ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                      <div className="text-xs text-muted-text">Total referrals</div>
                      <div className="mt-1 text-2xl font-bold text-black">
                        {referralLoading ? "—" : referralSummary?.totalReferrals ?? 0}
                      </div>
                    </div>
                  </div>

              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-text">Referral points</div>
                    <div className="mt-1 text-xl font-bold text-black">
                      {referralLoading ? "—" : referralSummary?.referralPointsTotal ?? 0}
                    </div>
                  </div>
                  <div className="text-sm text-muted-text">
                    Last 10 referral awards
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {(referralSummary?.referralPointsHistory || []).length === 0 ? (
                    <div className="text-sm text-muted-text">No referral points yet</div>
                  ) : (
                    (referralSummary?.referralPointsHistory || []).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-black">{formatReferralReason(row)}</span>
                        <span className="font-semibold text-green-700">+{row.points}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

                  <div className="rounded-lg border border-border-gray bg-white p-4">
                    <div className="text-xs text-muted-text">Referral link</div>
                    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-black break-all">{referralLink || "—"}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(referralLink, "link")}
                        disabled={referralLoading || !referralLink}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {copied === "link" ? "Copied" : "Copy link"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Earnings & Withdraw Card (Seller Only) */}
            {!isBuyer && (
              <Card className="p-6 bg-white/80 border-white/70">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900 mb-1">
                        Manage Your Earnings
                      </h3>
                      <p className="text-green-700 text-sm">
                        View your balance and withdraw funds from completed orders
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => window.location.href = '/dashboard/earnings'}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Earnings
                  </Button>
                </div>
              </Card>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-blue" />
                  {isBuyer ? "Spending Trend" : "Revenue Trend"}
                </h3>
                <div className="w-full overflow-x-auto">
                  <RevenueChart data={analytics?.revenue || []} labels={analytics?.labels || []} />
                </div>
              </Card>

              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-blue" />
                  {isBuyer ? "Purchase Volume" : "Order Volume"}
                </h3>
                <div className="w-full overflow-x-auto">
                  <OrdersChart data={analytics?.orders || []} labels={analytics?.labels || []} />
                </div>
              </Card>
            </div>

            {/* Points Chart & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-blue" />
                  Points Growth
                </h3>
                <div className="w-full overflow-x-auto">
                  <PointsChart data={analytics?.points || []} labels={analytics?.labels || []} />
                </div>
              </Card>

              <Card className="p-4 md:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold text-black mb-4">Recent Activity</h3>
                <ActivityFeed activities={stats?.recentActivity || []} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
