"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { Copy, Link2, User, Users } from "lucide-react";

type ReferralSummary = {
  referralCode: string;
  totalReferrals: number;
};

export default function ProfilePage() {
  const { walletAddress, isAuthenticated, isCreatingWallet } = useCivicWallet();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/referrals/summary", { cache: "no-store" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load referrals");
        }
        const data = await res.json();
        setSummary({
          referralCode: data.referralCode,
          totalReferrals: data.totalReferrals,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load referrals");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [walletAddress]);

  const referralLink = useMemo(() => {
    if (!summary?.referralCode || !baseUrl) return "";
    return `${baseUrl}/onboarding?ref=${encodeURIComponent(summary.referralCode)}`;
  }, [summary?.referralCode, baseUrl]);

  const handleCopy = async (value: string, type: "code" | "link") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Unable to copy to clipboard");
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

  const isReady = isAuthenticated && !isCreatingWallet && walletAddress;

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Profile</h1>
            <p className="text-muted-text">Manage your account details and preferences</p>
          </div>
        </div>

        <Card>
          <div className="text-center py-10">
            <User className="w-14 h-14 text-muted-text mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-black mb-1">Profile Management</h3>
            <p className="text-muted-text">View and edit your profile information</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-primary-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Referrals</h3>
                <p className="text-sm text-muted-text">Share your link and track your referrals</p>
              </div>
            </div>

            {!isReady && (
              <div className="rounded-lg border border-border-gray bg-white p-4 text-sm text-muted-text">
                Connect your wallet to view your referral details.
              </div>
            )}

            {isReady && (
              <div className="space-y-3">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border-gray bg-white p-4">
                    <div className="text-xs text-muted-text">Your referral code</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      {loading ? (
                        <span className="text-sm text-muted-text">Loading...</span>
                      ) : (
                        renderReferralBlocks(summary?.referralCode)
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(summary?.referralCode || "", "code")}
                        disabled={loading || !summary?.referralCode}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied === "code" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-gray bg-white p-4">
                    <div className="text-xs text-muted-text">Total referrals</div>
                    <div className="mt-1 text-2xl font-bold text-black">
                      {loading ? "—" : summary?.totalReferrals ?? 0}
                    </div>
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
                      disabled={loading || !referralLink}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      {copied === "link" ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
