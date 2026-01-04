"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
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

  // Configure wallets with Mobile Wallet Adapter for deep linking
  const wallets = useMemo(
    () => [
      // Mobile Wallet Adapter for native app deep linking (iOS/Android)
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "StudIQ Campus Store",
          uri: "https://store.studiq.fun",
          icon: "https://i.postimg.cc/VNXWGB8P/logo.jpg",
        },
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
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
