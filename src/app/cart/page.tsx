/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/react-hooks";
import { createTransferTransaction, waitForConfirmation } from "@/lib/solana";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { ShoppingCart, Trash2, Minus, Plus, Loader2, CheckCircle, XCircle, Truck, MapPin } from "lucide-react";
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

  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"solana" | "pod">("solana");

  // Use effect to handle pickup payment method default
  /* useEffect(() => {
     if (deliveryMethod === 'pickup') setPaymentMethod('pod');
  }, [deliveryMethod]); */

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    email: "", // Added email state
    address: "",
    city: "",
    zip: "",
  });

  async function checkout() {
    // If POD (or Pickup), we might not need wallet connected if we allow guest checkout, 
    // but the backend uses wallet address as ID. Let's keep wallet req for now for auth.
    const userAddress = auth.address || (wallet.status === "connected" ? wallet.session?.account?.address.toString() : null);

    if (!userAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (paymentMethod === "solana" && wallet.status !== "connected") {
      setError("Wallet not connected for crypto payment");
      return;
    }

    // Validate Delivery Info
    if (!deliveryDetails.name || !deliveryDetails.email) {
      setError("Please enter recipient name and email");
      return;
    }
    if (deliveryMethod === "shipping" && (!deliveryDetails.address || !deliveryDetails.city || !deliveryDetails.zip)) {
      setError("Please fill in all shipping details");
      return;
    }

    setCheckoutStatus("creating");
    setError(null);

    try {
      // Step 1: Create order
      // Determine final payment method: if pickup, force POD/POP logic
      const finalPaymentMethod = deliveryMethod === "pickup" ? "pod" : paymentMethod;

      const payload = {
        buyer: userAddress,
        storeId: items[0]?.storeId || "",
        items: items.map((i) => ({ productId: i.id, qty: i.qty })),
        currency: "SOL" as const,
        deliveryMethod,
        deliveryDetails,
        paymentMethod: finalPaymentMethod,
        buyerEmail: deliveryDetails.email,
      };

      const createRes = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        console.error("Order creation failed:", errorData);
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await createRes.json();
      console.log("Order created:", orderData);
      setOrderId(orderData.orderId);

      // Handle Pay on Delivery or Free Orders
      if (deliveryMethod === "pickup" || (orderData.paymentMethod === "pod")) {
        // Need to pass this intent to backend or just handle success since order is "pending" payment
        // For this demo, we assume the backend marked it as 'pending_payment' or similar if we sent a flag.
        // Let's update the checkout-create API to accept a payment method flag? 
        // Or simply: if we selected "Cash on Delivery", we skip the blockchain part.

        // Wait, we didn't send "paymentMethod" to the create API yet.
        // Let's assume for now valid POD orders just skip the tx.

        setCheckoutStatus("success");
        setTimeout(() => {
          clear();
          window.location.href = "/dashboard/orders";
        }, 3000);
        return;
      }

      // Validate Recipient Address for Crypto details
      if (!orderData.payTo) {
        throw new Error("Store wallet address is missing. Cannot verify payment destination.");
      }

      // Step 2: Create Solana transaction
      setCheckoutStatus("signing");
      const transaction = await createTransferTransaction(
        userAddress,
        orderData.payTo,
        total
      );

      // Step 3: Sign and send transaction
      if (wallet.status !== "connected" || !wallet.session?.signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      // Use 'as any' to bypass strict type checks between legacy/versioned if needed
      // but VersionedTransaction is generally supported by modern adapters
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
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-border-gray"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-soft-gray-bg rounded-lg flex-shrink-0 flex items-center justify-center text-muted-text text-xs">
                          No image
                        </div>
                      )}
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

              {/* Delivery Options */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Delivery Method</h3>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setDeliveryMethod("shipping")}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${deliveryMethod === "shipping"
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-border-gray hover:bg-gray-50"
                      }`}
                  >
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">Shipping</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${deliveryMethod === "pickup"
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-border-gray hover:bg-gray-50"
                      }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Pickup</span>
                  </button>
                </div>

                {/* Payment Method Selection */}
                {deliveryMethod === "shipping" && items.every(i => i.isPodEnabled) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-black mb-3">Payment Method</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPaymentMethod("solana")}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === "solana"
                          ? "border-primary-blue bg-blue-50 text-primary-blue"
                          : "border-border-gray hover:bg-gray-50"
                          }`}
                      >
                        <span className="font-medium">Solana (Crypto)</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("pod")}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === "pod"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-border-gray hover:bg-gray-50"
                          }`}
                      >
                        <span className="font-medium">Cash on Delivery</span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Auto-set to POD if Pickup? Or confirm? Let's default pickup to POD usually or allow both */}
                {deliveryMethod === "pickup" && (
                  <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    Pickup orders are typically paid in person. Payment method set to Pay on Pickup.
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    placeholder="john@example.com"
                    type="email"
                    value={deliveryDetails.email}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, email: e.target.value })}
                  />
                  <Input
                    label="Recipient Name"
                    placeholder="Full Name"
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                  />
                  {deliveryMethod === "shipping" && (
                    <>
                      <Input
                        label="Street Address"
                        placeholder="123 Campus Dr"
                        value={deliveryDetails.address}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          placeholder="San Francisco"
                          value={deliveryDetails.city}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                        />
                        <Input
                          label="Zip Code"
                          placeholder="94105"
                          value={deliveryDetails.zip}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, zip: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {deliveryMethod === "pickup" && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                      You will pick up this order directly from the seller at the store location or agreed meeting point.
                    </div>
                  )}
                </div>
              </Card>
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
                  {deliveryMethod === "shipping" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-text">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                  )}
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
