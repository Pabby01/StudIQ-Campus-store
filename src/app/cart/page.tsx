/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/react-hooks";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const updateQty = useCart((s) => s.updateQty);
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
    const res = await fetch("/api/checkout/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Checkout failed");
      return;
    }
    const data = await res.json();
    if (wallet.status !== "connected") {
      alert("Wallet not connected");
      return;
    }
    try {
      const txSig =
        (await wallet.session.signTransaction?.({
          to: data.payTo,
          amount: total,
          currency: data.currency,
        } as any)) ?? "";
      await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId, txSig }),
      });
      alert("Payment confirmed");
      clear();
    } catch {
      alert("Payment failed");
    }
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Shopping Cart</h1>
          <p className="text-muted-text">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Your cart is empty</h3>
            <p className="text-muted-text mb-6">Add some products to get started</p>
            <Button variant="primary" onClick={() => (window.location.href = "/search")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-soft-gray-bg rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black mb-1">{item.name}</h3>
                      <p className="text-lg font-bold text-primary-blue mb-3">
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-soft-gray-bg rounded-lg p-1">
                          <button
                            onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        ${(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h3 className="text-lg font-semibold text-black mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-text">Subtotal</span>
                    <span className="font-medium text-black">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-text">Platform Fee</span>
                    <span className="font-medium text-black">$0.00</span>
                  </div>
                  <div className="border-t border-border-gray pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Total</span>
                      <span className="text-2xl font-bold text-primary-blue">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="primary" className="w-full" onClick={() => void checkout()}>
                    Checkout with Solana
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => clear()}>
                    Clear Cart
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
