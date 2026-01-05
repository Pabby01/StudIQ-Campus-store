"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
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

  // For PWAs: Use standard wallet adapters which have mobile deep linking built-in
  // SolanaMobileWalletAdapter is for native Android apps only (uses localhost websocket)
  const wallets = useMemo(
    () => {
      console.log("[WALLET INIT] Creating wallet adapters for PWA...");
      console.log("[WALLET INIT] Using Phantom and Solflare (with mobile deep linking)");

      // Both Phantom and Solflare support mobile deep linking for PWAs
      // They will automatically open the wallet app via deep link on mobile
      const phantomAdapter = new PhantomWalletAdapter();
      const solflareAdapter = new SolflareWalletAdapter();

      console.log("[WALLET INIT] Adapters created");
      console.log("[WALLET INIT] Total adapters:", 2);
      console.log("[WALLET INIT] Mobile support: Deep linking (not websocket)");

      return [phantomAdapter, solflareAdapter];
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
        onError={(error, adapter) => {
          // Ignore errors from Mobile Wallet Adapter
          // It's auto-installed by @solana/wallet-adapter-react but doesn't work for PWAs
          if (adapter?.name === 'Mobile Wallet Adapter') {
            console.log("[WALLET] Ignoring Mobile Wallet Adapter error");
            return;
          }

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
