"use client";

import Link from "next/link";
import { useWalletConnection, useWallet, useConnectWallet, useDisconnectWallet } from "@solana/react-hooks";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export default function Navbar() {
  const wallet = useWallet();
  const { connectors } = useWalletConnection();
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const auth = useWalletAuth();
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-semibold">StudIQ Campus Store</Link>
        <Link href="/search" className="text-sm">Search</Link>
        <Link href="/prediction" className="text-sm">Prediction</Link>
      </div>
      {wallet.status === "connected" ? (
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-600">{auth.address}</div>
          <button className="rounded-md border px-3 py-1" onClick={() => void disconnect()}>Disconnect</button>
        </div>
      ) : (
        <div className="flex gap-2">
          {connectors.map((c) => (
            <button key={c.id} className="rounded-md border px-3 py-1" onClick={async () => { await connect(c.id); await auth.connectAndAuth(); }}>Connect {c.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

