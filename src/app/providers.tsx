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

  console.log("[WALLET CONFIG] Network:", network);
  console.log("[WALLET CONFIG] Endpoint:", endpoint);

  return {
    network,
    endpoint
  };
}

export default function Providers({ children }: { children: ReactNode }) {
  const { endpoint } = getRpcConfig();

  // Configure wallets with Mobile Wallet Adapter for mobile deep linking
  const wallets = useMemo(
    () => {
      console.log("[WALLET INIT] Creating wallet adapters...");

      const mobileAdapter = new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "StudIQ Campus Store",
          uri: "https://store.studiq.fun",
          icon: "https://i.postimg.cc/VNXWGB8P/logo.jpg",
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: "devnet",
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      });

      console.log("[WALLET INIT] Mobile Wallet Adapter created");
      console.log("[WALLET INIT] App Identity URI:", "https://store.studiq.fun");

      const phantomAdapter = new PhantomWalletAdapter();
      const solflareAdapter = new SolflareWalletAdapter();

      console.log("[WALLET INIT] Desktop adapters created");
      console.log("[WALLET INIT] Total adapters:", 3);

      return [mobileAdapter, phantomAdapter, solflareAdapter];
    },
    []
  );

  console.log("[WALLET PROVIDER] Rendering with", wallets.length, "wallets");

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: 'processed', // Faster confirmations
        wsEndpoint: undefined,
        confirmTransactionInitialTimeout: 60000, // 60 seconds
      }}
    >
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        localStorageKey="studiq-wallet"
        onError={(error) => {
          console.error("[WALLET ERROR]", error);
          console.error("[WALLET ERROR] Name:", error.name);
          console.error("[WALLET ERROR] Message:", error.message);
          if (error.stack) {
            console.error("[WALLET ERROR] Stack:", error.stack.split('\n')[0]);
          }
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
