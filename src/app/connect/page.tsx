"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Wallet, Shield, Zap, Loader2 } from "lucide-react";

export default function ConnectPage() {
  const wallet = useWallet();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (wallet.connected && !checking) {
      handleConnected();
    }
  }, [wallet.connected]);

  async function handleConnected() {
    if (!wallet.connected || !wallet.publicKey) return;

    setChecking(true);
    const address = wallet.publicKey.toString();

    try {
      console.log("Checking profile for address:", address);
      const profileRes = await fetch(`/api/profile/get?address=${address}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        console.log("Profile check result:", profile ? "Found" : "Not Found", profile);

        if (profile && profile.name && profile.school && profile.campus) {
          // Existing user - go to home
          router.push("/");
        } else {
          // New or incomplete user - go to onboarding
          router.push("/onboarding");
        }
      } else {
        // Profile doesn't exist (404) or other error - redirect to onboarding
        console.log("Profile not found or error, redirecting to onboarding");
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Profile check error:", error);
      // Network error - redirect to onboarding to be safe
      router.push("/onboarding");
    } finally {
      setChecking(false);
    }
  }

  if (wallet.connected) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-12 h-12 text-primary-blue animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Setting up your account...</h2>
          <p className="text-muted-text">Please wait</p>
        </Card>
      </div>
    );
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

        <div className="mb-6">
          <p className="text-sm text-center text-muted-text mb-4">
            Click the "Connect" button in the navbar to get started
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Go to Homepage
          </Button>
        </div>

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
