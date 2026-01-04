"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import type { ReactNode } from "react";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// CRITICAL: Import wallet-standard-mobile to enable PWA mobile wallet connections
// This registers the Mobile Wallet Adapter for local connections on the same device
import "@solana-mobile/wallet-standard-mobile";

function getRpcConfig() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

  return {
    network,
    endpoint
  };
}

export default function Providers({ children }: { children: ReactNode }) {
  const { endpoint } = getRpcConfig();

  // Get the app URL for redirects (critical for PWA mode)
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun';

  // Configure wallets - Phantom and Solflare work on BOTH desktop and mobile web
  // The wallet-standard-mobile import above automatically registers MWA
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        // Critical: Tell wallet where to redirect after authorization
        wsEndpoint: undefined,
      }}
    >
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        // This ensures proper redirect handling in PWA mode
        localStorageKey="studiq-wallet"
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
