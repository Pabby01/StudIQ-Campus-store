"use client";

import { useMemo, useEffect, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CivicAuthProvider } from "@civic/auth-web3/react";
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
  const [mounted, setMounted] = useState(false);

  // Civic Auth configuration
  const civicClientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;

  // Empty wallets array - Civic will provide the embedded wallet
  const wallets = useMemo(() => [], []);

  // Only log on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (!civicClientId) {
      console.error("[CIVIC] Client ID not configured! Add NEXT_PUBLIC_CIVIC_CLIENT_ID to .env");
    }
    console.log("[PROVIDER] Initialized with Civic Auth Web3");
  }, [civicClientId]);

  // Avoid hydration issues by rendering a placeholder during SSR
  if (!mounted) {
    return null;
  }

  return (
    <CivicAuthProvider
      clientId={civicClientId!}
      onSignIn={async (user) => {
        const userEmail = user && 'email' in user ? user.email : null;
        console.log("[CIVIC] User signed in:", userEmail);
      }}
      onSignOut={() => {
        console.log("[CIVIC] User signed out");
        if (typeof window !== 'undefined') {
          window.location.href = "/";
        }
      }}
    >
      <ConnectionProvider
        endpoint={endpoint}
        config={{
          commitment: 'processed',
          wsEndpoint: undefined,
          confirmTransactionInitialTimeout: 60000,
        }}
      >
        <WalletProvider
          wallets={wallets}
          autoConnect={true}
        >
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </CivicAuthProvider>
  );
}
