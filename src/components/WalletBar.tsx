"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import MobileWalletButton from "@/components/MobileWalletButton";

export default function WalletBar() {
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <div>
          <div className="font-semibold">Wallet Connected</div>
          <div className="text-zinc-500">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</div>
        </div>
        <button
          className="rounded-md bg-black px-3 py-1 text-white hover:bg-gray-800 transition-colors"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Use WalletMultiButton for all devices - it handles desktop and mobile
  return <MobileWalletButton />;
}
