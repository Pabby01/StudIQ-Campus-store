/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/react-hooks";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const auth = useWalletAuth();
  const wallet = useWallet();

  async function checkout() {
    if (!auth.address) {
      alert("Connect wallet first");
      return;
    }
    const payload = {
      buyer: auth.address,
      storeId: "",
      items: items.map((i) => ({ productId: i.id, qty: i.qty })),
      currency: "SOL" as const,
    };
    const res = await fetch("/api/checkout/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { alert("Checkout failed"); return; }
    const data = await res.json();
    if (wallet.status !== "connected") { alert("Wallet not connected"); return; }
    try {
      const txSig = await wallet.session.signTransaction?.({ to: data.payTo, amount: total, currency: data.currency } as any) ?? "";
      await fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: data.orderId, txSig }) });
      alert("Payment confirmed");
      clear();
    } catch {
      alert("Payment failed");
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="text-zinc-600">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-zinc-600">{i.qty} × ${i.price.toFixed(2)}</div>
              </div>
              <button className="rounded-md border px-3 py-1" onClick={() => remove(i.id)}>Remove</button>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm text-zinc-600">Total</div>
            <div className="text-lg font-semibold">${total.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1" onClick={() => clear()}>Clear</button>
            <button className="rounded-md bg-black px-3 py-1 text-white" onClick={() => void checkout()}>Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}
