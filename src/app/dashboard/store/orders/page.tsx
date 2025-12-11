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
        {(data ?? []).length === 0 ? (
          <div className="text-center py-12 text-muted-text border rounded-lg bg-gray-50">
            <p>No orders found yet.</p>
          </div>
        ) : (
          (data ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-black">Order #{o.id.slice(0, 8)}</div>
                  <div className="text-sm text-zinc-600 mt-1">Status: <span className="font-medium capitalize">{o.status}</span></div>
                  <div className="text-sm text-zinc-600">Amount: <span className="font-bold text-primary-blue">${Number(o.amount).toFixed(2)}</span></div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    onClick={() => void update(o.id, "shipped")}
                  >
                    Mark Shipped
                  </button>
                  <button
                    className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                    onClick={() => void update(o.id, "completed")}
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
