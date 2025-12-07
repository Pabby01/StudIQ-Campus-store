"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { getWalletStandardConnectors } from "@solana/client";
import type { ReactNode } from "react";

function getDevnetConfig() {
  return {
    endpoint: "https://api.devnet.solana.com",
    commitment: "confirmed" as const,
    websocketEndpoint: "wss://api.devnet.solana.com",
  };
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SolanaProvider
      config={{ ...getDevnetConfig(), walletConnectors: getWalletStandardConnectors({}) }}
      query={{ suspense: false }}
      walletPersistence={{ storageKey: "solana:last-connector" }}
    >
      {children}
    </SolanaProvider>
  );
}
