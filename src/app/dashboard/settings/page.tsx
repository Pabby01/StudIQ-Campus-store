"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PremiumBadge from "@/components/PremiumBadge";
import { Settings, Crown, TrendingUp, CreditCard, AlertCircle, Check } from "lucide-react";

type SubscriptionData = {
  plan: {
    name: string;
    display_name: string;
    price_usd: number;
    platform_fee_percentage: number;
    features: { features: string[] };
  };
  status: string;
  expiresAt?: string;
  autoRenew?: boolean;
  isFreeTier?: boolean;
};

export default function DashboardSettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [storeLimit, setStoreLimit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);

  const address = wallet.connected && wallet.publicKey ? wallet.publicKey.toString() : null;

  useEffect(() => {
    if (address) {
      fetchSubscription();
      fetchProfile();
      fetchStoreLimit();
    }
  }, [address]);

  useEffect(() => {
    const target = searchParams?.get("upgrade");
    if (target) {
      setUpgradeTarget(target);
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    if (!address) return;

    try {
      const res = await fetch(`/api/subscription/status?address=${address}`);
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!address) return;

    try {
      const res = await fetch(`/api/profile?address=${address}`);
      const data = await res.json();
      setProfile(data.profile);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchStoreLimit = async () => {
    if (!address) return;

    try {
      const res = await fetch(`/api/store/check-limit?address=${address}`);
      const data = await res.json();
      setStoreLimit(data);
    } catch (error) {
      console.error("Failed to fetch store limit:", error);
    }
  };

  const handleUpgrade = (planName: string) => {
    router.push(`/pricing`);
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-muted-text">Please connect your wallet to manage settings</p>
        </Card>
      </div>
    );
  }

  const isPremium = subscription?.plan?.name === "premium" || subscription?.plan?.name === "enterprise";
  const currentPlan = subscription?.plan;

  return (
    <div className="min-h-screen bg-soft-gray-bg px-4 py-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">Settings</h1>
            <p className="text-sm md:text-base text-muted-text">Manage your account and subscription</p>
          </div>
        </div>

        {/* Current Subscription */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Current Plan
              </h3>
              <p className="text-sm text-muted-text">Your active subscription tier</p>
            </div>
            {isPremium && <PremiumBadge />}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-text">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-text mb-1">Plan</p>
                  <p className="text-2xl font-bold text-black">{currentPlan?.display_name || "Free"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-text mb-1">Platform Fee</p>
                  <p className="text-2xl font-bold text-green-600">{currentPlan?.platform_fee_percentage || 5}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-text mb-1">Monthly Cost</p>
                  <p className="text-2xl font-bold text-black">${currentPlan?.price_usd?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-text mb-1">Status</p>
                  <p className="text-2xl font-bold text-green-600 capitalize">{subscription?.status || "Active"}</p>
                </div>
              </div>

              {/* Features */}
              {currentPlan?.features && (
                <div className="mb-6">
                  <h4 className="font-semibold text-black mb-3">Your Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(currentPlan.features as any).features?.map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade CTA */}
              {subscription?.isFreeTier && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-black mb-2">Upgrade to Premium</h4>
                      <p className="text-sm text-gray-700 mb-4">
                        Save 60% on platform fees (2% instead of 5%), get a premium badge,
                        and unlock advanced analytics for just $14.99/month.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => handleUpgrade("premium")}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage Subscription */}
              {!subscription?.isFreeTier && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/pricing")}
                  >
                    View All Plans
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel your subscription? You'll lose premium features at the end of your billing period.")) {
                        // TODO: Implement cancel API
                        alert("Cancellation will be available soon");
                      }
                    }}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Store Management */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Store Management</h3>
          {storeLimit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-text">Stores Created</p>
                  <p className="text-2xl font-bold text-black">
                    {storeLimit.currentCount} / {storeLimit.maxAllowed}
                  </p>
                  <p className="text-xs text-muted-text mt-1">{storeLimit.planName} Plan</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium mb-2">
                    {storeLimit.percentage}% Used
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${storeLimit.percentage >= 100
                        ? "bg-red-500"
                        : storeLimit.percentage >= 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        }`}
                      style={{ width: `${Math.min(storeLimit.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {!storeLimit.allowed && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 font-medium mb-2">
                    Store Limit Reached
                  </p>
                  <p className="text-sm text-amber-700 mb-3">
                    You've created the maximum number of stores allowed on the {storeLimit.planName} plan.
                  </p>
                  {storeLimit.planName === "Free" && (
                    <Button variant="primary" size="sm" onClick={() => router.push("/pricing")}>
                      Upgrade to Create More Stores
                    </Button>
                  )}
                </div>
              )}

              {storeLimit.isNearLimit && storeLimit.allowed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    You're near your store limit. Consider upgrading for more capacity.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-text">Loading store information...</p>
          )}
        </Card>

        {/* Account Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Account Information</h3>
          {profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.name || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.email || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.school || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.campus || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.level || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {profile.phone || "Not set"}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all">
                  {address}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/settings/edit-profile")}
              >
                Edit Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                  {address}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Billing History (Placeholder) */}
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-black">Billing History</h3>
              <p className="text-sm text-muted-text">View your past payments and invoices</p>
            </div>
          </div>
          <div className="text-center py-8 text-muted-text">
            No billing history yet
          </div>
        </Card>

        {/* Help */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-black mb-1">Need Help?</h4>
              <p className="text-sm text-gray-700 mb-3">
                Have questions about your subscription or need assistance? We're here to help!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/faq")}
              >
                Visit FAQ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
