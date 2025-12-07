"use client";

import useSWR from "swr";
import { useWalletAuth } from "@/hooks/useWalletAuth";

type Order = Readonly<{ id: string; status: string; amount: number }>;

export default function DashboardOrdersPage() {
  const auth = useWalletAuth();
  const { data } = useSWR<Order[]>(auth.address ? `/api/orders/my?address=${auth.address}` : null, async (url: string) => (await fetch(url)).json());
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <div key={o.id} className="rounded-lg border p-3">
            <div className="font-medium">Order {o.id}</div>
            <div className="text-sm text-zinc-600">Status: {o.status}</div>
            <div className="text-sm text-zinc-600">Amount: ${Number(o.amount).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
