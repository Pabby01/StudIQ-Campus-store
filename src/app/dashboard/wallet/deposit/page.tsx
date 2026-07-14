"use client";

import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Wallet, Loader2, ArrowRight } from "lucide-react";

export default function DepositPage() {
  const { walletAddress, email } = useCivicWallet();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Deposit initialization failed.");
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No payment link returned.");
      }
    } catch (err) {
      console.error("Deposit error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate deposit");
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-8 sm:px-6 lg:px-8 w-full max-w-full">
      <div className="max-w-md mx-auto space-y-6 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Topup Wallet</h1>
            <p className="text-sm text-slate-500">Fund your wallet with Naira via Passpoint</p>
          </div>
        </div>

        <Card className="p-6 border-white/60 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount to Deposit (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₦</span>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  className="pl-8 text-lg font-semibold"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setError(null);
                    setAmount(e.target.value);
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Minimum deposit: ₦100</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full flex justify-center items-center gap-2 mt-4"
              onClick={handleDeposit}
              disabled={loading || !amount || parseFloat(amount) < 100}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
