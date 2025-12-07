/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/react-hooks";
import { createTransferTransaction, waitForConfirmation } from "@/lib/solana";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ShoppingCart, Trash2, Minus, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

type CheckoutStatus = "idle" | "creating" | "signing" | "confirming" | "verifying" | "success" | "error";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const updateQty = useCart((s) => s.updateQty);
  const auth = useWalletAuth();
  const wallet = useWallet();

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function checkout() {
    if (!auth.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (wallet.status !== "connected") {
      setError("Wallet not connected");
      return;
    }

    setCheckoutStatus("creating");
    setError(null);

    try {
      // Step 1: Create order
      const payload = {
        buyer: auth.address,
        storeId: items[0]?.storeId || "",
        items: items.map((i) => ({ productId: i.id, qty: i.qty })),
        currency: "SOL" as const,
      };

      const createRes = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await createRes.json();
      setOrderId(orderData.orderId);

      // Step 2: Create Solana transaction
      setCheckoutStatus("signing");
      const transaction = await createTransferTransaction(
        auth.address,
        orderData.payTo,
        total
      );

      // Step 3: Sign and send transaction
      if (!wallet.session.signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      const signedTx = await wallet.session.signTransaction(transaction as any);

      // Send transaction
      const signature = await wallet.session.sendTransaction?.(signedTx as any);

      if (!signature) {
        throw new Error("Failed to send transaction");
      }

      // Step 4: Wait for confirmation
      setCheckoutStatus("confirming");
      await waitForConfirmation(signature, 60000);

      // Step 5: Verify transaction on backend
      setCheckoutStatus("verifying");
      const verifyRes = await fetch("/api/checkout/verify-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          txSignature: signature,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || "Transaction verification failed");
      }

      // Success!
      setCheckoutStatus("success");
      setTimeout(() => {
        clear();
        window.location.href = "/dashboard/orders";
      }, 3000);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutStatus("error");
    }
  }

  const getStatusMessage = () => {
    switch (checkoutStatus) {
      case "creating":
        return "Creating order...";
      case "signing":
        return "Please sign the transaction in your wallet...";
      case "confirming":
        return "Confirming transaction on Solana network...";
      case "verifying":
        return "Verifying payment...";
      case "success":
        return "Payment successful! Redirecting...";
      case "error":
        return error || "An error occurred";
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Shopping Cart</h1>
          <p className="text-muted-text">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Status Messages */}
        {checkoutStatus !== "idle" && (
          <Card className="mb-6 p-4">
            <div className="flex items-center gap-3">
              {checkoutStatus === "success" ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : checkoutStatus === "error" ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Loader2 className="w-6 h-6 text-primary-blue animate-spin" />
              )}
              <div>
                <p
                  className={`font-medium ${checkoutStatus === "success"
                      ? "text-green-900"
                      : checkoutStatus === "error"
                        ? "text-red-900"
                        : "text-black"
                    }`}
                >
                  {getStatusMessage()}
                </p>
                {orderId && (
                  <p className="text-xs text-muted-text mt-1">Order ID: {orderId}</p>
                )}
              </div>
            </div>
          </Card>
        )}

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
                            disabled={checkoutStatus !== "idle"}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            disabled={checkoutStatus !== "idle"}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={checkoutStatus !== "idle"}
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
                      <span className="font-semibold text-black">Total (SOL)</span>
                      <span className="text-2xl font-bold text-primary-blue">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => void checkout()}
                    disabled={checkoutStatus !== "idle" && checkoutStatus !== "error"}
                  >
                    {checkoutStatus === "idle" || checkoutStatus === "error"
                      ? "Checkout with Solana"
                      : "Processing..."}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => clear()}
                    disabled={checkoutStatus !== "idle"}
                  >
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
