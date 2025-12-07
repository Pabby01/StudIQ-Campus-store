"use client";

import bs58 from "bs58";
import { useWallet } from "@solana/react-hooks";

type NonceResponse = { nonce: string };
type VerifyResponse = { ok: boolean };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

export function useWalletAuth() {
  const wallet = useWallet();
  const address = wallet.status === "connected" ? wallet.session.account.address.toString() : null;

  async function connectAndAuth() {
    if (wallet.status !== "connected") return false;
    const nonce = await postJson<NonceResponse>("/api/auth/nonce", { address });
    const message = new TextEncoder().encode(nonce.nonce);
    if (!wallet.session.signMessage) return false;
    const signature = await wallet.session.signMessage(message);
    const payload = { address, nonce: nonce.nonce, signature: bs58.encode(signature) };
    const verified = await postJson<VerifyResponse>("/api/auth/verify", payload);
    return verified.ok;
  }

  return { address, connectAndAuth };
}
