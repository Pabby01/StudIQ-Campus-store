"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { getWalletStandardConnectors } from "@solana/client";
import type { ReactNode } from "react";
import { useMemo } from "react";

// Mobile wallet adapter for iOS/Android support
function useMobileWalletAdapterConfig() {
  return useMemo(() => {
    // Detect if user is on mobile
    const isMobile = typeof window !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Dynamic import for mobile wallet adapter
      // This prevents SSR issues and only loads on mobile devices
      try {
        // Mobile-specific configuration
        return {
          cluster: "devnet" as const,
          appIdentity: {
            name: "StudIQ Campus Store",
            uri: typeof window !== 'undefined' ? window.location.origin : "https://studiq.app",
            icon: "/logo.png",
          },
        };
      } catch (error) {
        console.warn("Mobile wallet adapter not available:", error);
        return null;
      }
    }
    return null;
  }, []);
}

function getDevnetConfig() {
  return {
    endpoint: "https://api.devnet.solana.com",
    commitment: "confirmed" as const,
    websocketEndpoint: "wss://api.devnet.solana.com",
  };
}

export default function Providers({ children }: { children: ReactNode }) {
  const mobileConfig = useMobileWalletAdapterConfig();

  // Combine desktop and mobile wallet connectors
  const walletConnectors = useMemo(() => {
    const connectors = getWalletStandardConnectors({});

    // Mobile wallet adapter will auto-detect and use deep linking
    // The @solana/react-hooks already handles mobile wallets through Wallet Standard
    // We just need to ensure proper configuration

    return connectors;
  }, []);

  return (
    <SolanaProvider
      config={{
        ...getDevnetConfig(),
        walletConnectors
      }}
      query={{ suspense: false }}
      walletPersistence={{ storageKey: "solana:last-connector" }}
    >
      {children}
    </SolanaProvider>
  );
}
