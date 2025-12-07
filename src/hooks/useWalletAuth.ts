"use client";

import bs58 from "bs58";
import { useWallet } from "@solana/react-hooks";
import { useState } from "react";

type NonceResponse = { nonce: string };
type VerifyResponse = { ok: boolean; error?: string };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

export function useWalletAuth() {
  const wallet = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = wallet.status === "connected" ? wallet.session.account.address : null;

  async function connectAndAuth(): Promise<boolean> {
    if (wallet.status !== "connected") {
      setError("Wallet not connected");
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Get nonce from server
      const addressStr = address!.toString();
      const { nonce } = await postJson<NonceResponse>("/api/auth/nonce", {
        address: addressStr,
      });

      // Sign the nonce directly (not a formatted message)
      // This is what Solana wallets expect
      const messageToSign = new TextEncoder().encode(nonce);

      if (!wallet.session.signMessage) {
        throw new Error("Wallet does not support message signing");
      }

      // Sign the message
      const signatureBytes = await wallet.session.signMessage(messageToSign);
      const signatureBase58 = bs58.encode(signatureBytes);

      // Verify signature with server
      const verified = await postJson<VerifyResponse>("/api/auth/verify", {
        address: addressStr,
        nonce,
        signature: signatureBase58,
      });

      if (!verified.ok) {
        throw new Error(verified.error || "Authentication failed");
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      console.error("Wallet auth error:", err);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  return {
    address: address?.toString() || null,
    connectAndAuth,
    isAuthenticating,
    error,
  };
}
