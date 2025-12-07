"use client";

import { useConnectWallet, useDisconnectWallet, useWallet } from "@solana/react-hooks";
import { useWalletConnection } from "@solana/react-hooks";

export default function WalletBar() {
  const wallet = useWallet();
  const { connectors } = useWalletConnection();
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();

  if (wallet.status === "connected") {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <div>
          <div className="font-semibold">Wallet Connected</div>
          <div className="text-zinc-500">{wallet.session.account.address.toString()}</div>
        </div>
        <button className="rounded-md bg-black px-3 py-1 text-white" onClick={() => void disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectors.map((c) => (
        <button
          key={c.id}
          className="rounded-md border px-3 py-1"
          onClick={() => void connect(c.id)}
        >
          Connect {c.name}
        </button>
      ))}
    </div>
  );
}
