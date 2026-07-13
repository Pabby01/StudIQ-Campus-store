/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useMemo, useEffect, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import type { ReactNode } from "react";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

function getRpcConfig() {
  return {
    network: SOLANA_CONFIG.network,
    endpoint: SOLANA_CONFIG.rpcUrl
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
  }, [civicClientId]);

  // Avoid hydration issues by rendering a placeholder during SSR
  if (!mounted) {
    return null;
  }

  return (
    <CivicAuthProvider
      clientId={civicClientId!}
      autoRedirect={false}
      redirectUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
      chains={[]}
      endpoints={{
        rpcs: {
          84532: { http: ["https://sepolia.base.org"] }
        }
      }}
      onSignIn={async (user) => {
        // Sign in handled
      }}
      onSignOut={() => {
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
