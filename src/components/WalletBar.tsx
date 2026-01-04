"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Button from "@/components/ui/Button";
import MobileWalletButton from "@/components/MobileWalletButton";
import { isMobileDevice } from "@/lib/mobileWallet";

export default function WalletBar() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const isMobile = isMobileDevice();

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

  // On mobile, use MobileWalletButton which handles deep linking properly
  if (isMobile) {
    return <MobileWalletButton />;
  }

  // On desktop, use custom modal
  return (
    <Button
      onClick={() => setVisible(true)}
      variant="primary"
    >
      Connect Wallet
    </Button>
  );
}
