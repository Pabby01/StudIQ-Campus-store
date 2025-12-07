"use client";

import useSWR from "swr";
import { useWalletAuth } from "@/hooks/useWalletAuth";

type Order = Readonly<{ id: string; status: string; amount: number }>;

export default function VendorOrdersPage() {
  const auth = useWalletAuth();
  const { data, mutate } = useSWR<Order[]>(auth.address ? `/api/vendor/orders?address=${auth.address}` : null, async (url: string) => (await fetch(url)).json());
  async function update(id: string, status: string) {
    await fetch("/api/orders/update-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, status }) });
    mutate();
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Store Orders</h1>
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <div key={o.id} className="rounded-lg border p-3">
            <div className="font-medium">Order {o.id}</div>
            <div className="text-sm text-zinc-600">Status: {o.status}</div>
            <div className="text-sm text-zinc-600">Amount: ${Number(o.amount).toFixed(2)}</div>
            <div className="mt-2 flex gap-2">
              <button className="rounded-md border px-2" onClick={() => void update(o.id, "shipped")}>Mark Shipped</button>
              <button className="rounded-md border px-2" onClick={() => void update(o.id, "completed")}>Mark Completed</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
