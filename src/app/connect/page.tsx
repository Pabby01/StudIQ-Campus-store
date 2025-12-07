"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletConnection, useWallet, useConnectWallet } from "@solana/react-hooks";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const { connectors } = useWalletConnection();
  const connect = useConnectWallet();
  const wallet = useWallet();
  const auth = useWalletAuth();
  const router = useRouter();
  async function handle(cId: string) {
    await connect(cId);
    const ok = await auth.connectAndAuth();
    if (!ok) return;
    const profileRes = await fetch(`/api/profile/get?address=${auth.address}`);
    const profile = await profileRes.json();
    const needsOnboarding = !profile?.name || !profile?.school || !profile?.campus || !profile?.level || !profile?.phone;
    router.push(needsOnboarding ? "/onboarding" : "/dashboard");
  }
  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Connect Wallet</h1>
      <div className="flex flex-wrap gap-2">
        {connectors.map((c) => (
          <button key={c.id} className="rounded-md border px-3 py-1" onClick={() => void handle(c.id)}>Connect {c.name}</button>
        ))}
      </div>
      {wallet.status === "connected" && <div className="text-sm text-zinc-600">Connected</div>}
    </div>
  );
}

