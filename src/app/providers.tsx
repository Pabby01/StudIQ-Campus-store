"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

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

  // Civic Auth configuration
  const civicClientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;

  if (!civicClientId) {
    console.error("[CIVIC] Client ID not configured! Add NEXT_PUBLIC_CIVIC_CLIENT_ID to .env");
  }

  // Empty wallets array - Civic will provide the embedded wallet
  const wallets = useMemo(() => {
    console.log("[WALLET INIT] Using Civic embedded wallets");
    return [];
  }, []);

  console.log("[PROVIDER] Initializing with Civic Auth");

  return (
    <CivicAuthProvider
      clientId={civicClientId!}
      onSignIn={async (user) => {
        // Handle successful sign-in
        const userEmail = user && 'email' in user ? user.email : null;
        console.log("[CIVIC] User signed in:", userEmail);

        // Check if user has completed onboarding
        if (user && userEmail) {
          try {
            const res = await fetch(`/api/profile/check?email=${encodeURIComponent(userEmail as string)}`);
            const data = await res.json();

            if (!data.exists && typeof window !== 'undefined') {
              console.log("[CIVIC] New user, redirecting to onboarding");
              window.location.href = "/onboarding";
            }
          } catch (error) {
            console.error("[CIVIC] Profile check failed:", error);
          }
        }
      }}
      onSignOut={() => {
        console.log("[CIVIC] User signed out");
        // Clear any cached data
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
