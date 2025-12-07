"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletConnection, useWallet, useConnectWallet } from "@solana/react-hooks";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Wallet, Shield, Zap, AlertCircle } from "lucide-react";

export default function ConnectPage() {
  const { connectors } = useWalletConnection();
  const connect = useConnectWallet();
  const wallet = useWallet();
  const auth = useWalletAuth();
  const router = useRouter();

  async function handle(cId: string) {
    try {
      await connect(cId);
      const ok = await auth.connectAndAuth();

      if (!ok) {
        // Error is already set in auth.error
        return;
      }

      // Check if user needs onboarding
      const profileRes = await fetch(`/api/profile/get?address=${auth.address}`);
      const profile = await profileRes.json();
      const needsOnboarding =
        !profile?.name || !profile?.school || !profile?.campus || !profile?.level || !profile?.phone;

      router.push(needsOnboarding ? "/onboarding" : "/dashboard");
    } catch (error) {
      console.error("Connection error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-blue" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Connect Your Wallet</h1>
          <p className="text-muted-text">
            Connect your Solana wallet to access the campus marketplace
          </p>
        </div>

        {/* Error Display */}
        {auth.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Authentication Failed</p>
              <p className="text-sm text-red-700 mt-1">{auth.error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {connectors.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => void handle(c.id)}
              disabled={auth.isAuthenticating}
            >
              <Wallet className="w-5 h-5 mr-3" />
              {auth.isAuthenticating ? "Authenticating..." : `Connect ${c.name}`}
            </Button>
          ))}
        </div>

        {wallet.status === "connected" && !auth.isAuthenticating && (
          <div className="text-center text-sm text-green-600 mb-4 font-medium">
            ✓ Wallet Connected - Signing message...
          </div>
        )}

        {/* Features */}
        <div className="border-t border-border-gray pt-6 space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-black">Secure & Safe</p>
              <p className="text-xs text-muted-text">Your keys, your crypto</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-black">Fast Transactions</p>
              <p className="text-xs text-muted-text">Powered by Solana</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
