"use client";

import { useCart } from "@/store/cart";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
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
            <button className="rounded-md bg-black px-3 py-1 text-white">Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}

