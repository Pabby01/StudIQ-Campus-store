"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler
} from "@solana-mobile/wallet-adapter-mobile";
import type { ReactNode } from "react";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

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

  // Configure wallets with Mobile Wallet Adapter for mobile deep linking
  const wallets = useMemo(
    () => [
      // CRITICAL: Mobile Wallet Adapter MUST be first for mobile devices
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "StudIQ Campus Store",
          // CRITICAL: This URI is where the wallet redirects back to after authorization
          // Must match your live domain exactly for PWA to reopen correctly
          uri: "https://store.studiq.fun",
          // Full URL to your app icon
          icon: "https://i.postimg.cc/VNXWGB8P/logo.jpg",
        },
        // Cache authorization so users don't have to approve every time
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: "devnet",
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
      // Desktop wallet adapters (browser extensions)
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
        wsEndpoint: undefined,
      }}
    >
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        localStorageKey="studiq-wallet"
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
