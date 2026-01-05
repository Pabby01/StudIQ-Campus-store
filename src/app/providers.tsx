"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
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
  const { endpoint, network } = getRpcConfig();

  // Configure wallets - WalletConnect for mobile PWA, standard adapters for desktop
  const wallets = useMemo(
    () => {
      console.log("[WALLET INIT] Creating wallet adapters for PWA...");

      // WalletConnect for reliable mobile connections via QR code + deep links
      const walletConnectAdapter = new WalletConnectWalletAdapter({
        network: network === "mainnet-beta" ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet,
        options: {
          projectId: "86c481a14ec4d1f6c545c9218e9d2206", // WalletConnect Cloud Project ID
          metadata: {
            name: "StudIQ Campus Store",
            description: "Decentralized campus marketplace on Solana",
            url: "https://store.studiq.fun",
            icons: ["https://i.postimg.cc/VNXWGB8P/logo.jpg"],
          },
        },
      });

      // Standard adapters for desktop browser extensions
      const solflareAdapter = new SolflareWalletAdapter();
      const phantomAdapter = new PhantomWalletAdapter();

      console.log("[WALLET INIT] Adapters created");
      console.log("[WALLET INIT] Total adapters:", 3);
      console.log("[WALLET INIT] Mobile support: WalletConnect (QR + Deep Link)");

      // WalletConnect first for mobile, standard adapters for desktop
      return [walletConnectAdapter, solflareAdapter, phantomAdapter];
    },
    [network]
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
