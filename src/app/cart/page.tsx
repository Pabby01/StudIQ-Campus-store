/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { createTransferTransaction, waitForConfirmation, broadcastTransaction } from "@/lib/solana";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { ShoppingCart, Trash2, Minus, Plus, Loader2, CheckCircle, XCircle, Truck, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { checkoutCreateSchema } from "@/lib/validators";
import { useStore } from "@/hooks/useStore";

type CheckoutStatus = "idle" | "creating" | "signing" | "confirming" | "verifying" | "success" | "error";

import AuthModal from "@/components/AuthModal";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const updateQty = useCart((s) => s.updateQty);

  // Use Civic wallet hook for unified access
  const { walletAddress, email, wallet, isAuthenticated, user, signTransaction } = useCivicWallet();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"solana" | "pod">("solana");

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    email: email || "", // Pre-fill from Civic
    address: "",
    city: "",
    zip: "",
  });

  const [paymentCurrency, setPaymentCurrency] = useState<"SOL" | "USDC">("SOL");

  const solPrice = useCart((s) => s.solPrice);
  const fetchSolPrice = useCart((s) => s.fetchSolPrice);
  const storeId = items[0]?.storeId ?? null;
  const { store: storeResponse } = useStore(storeId);
  const store = storeResponse?.store;
  const deliveryEnabled = store?.delivery_enabled ?? true;
  const pickupEnabled = store?.pickup_enabled ?? true;
  const deliveryFee = deliveryMethod === "shipping" ? Number(store?.delivery_fee ?? 0) : 0;
  const orderTotal = total + deliveryFee;
  const deliveryUnavailable = !deliveryEnabled && !pickupEnabled;

  // Set default payment currency based on items
  useEffect(() => {
    if (items.length > 0) {
      setPaymentCurrency((items[0]?.currency === "USDC") ? "USDC" : "SOL");
    }
  }, [items]);

  // Ensure price is fetched if missing or stale (Store handles caching)
  useEffect(() => {
    fetchSolPrice();
  }, []);

  // Pre-fill email when Civic user loads
  useEffect(() => {
    if (email && !deliveryDetails.email) {
      setDeliveryDetails(prev => ({ ...prev, email }));
    }
  }, [email]);

  useEffect(() => {
    if (deliveryMethod === "shipping" && !deliveryEnabled && pickupEnabled) {
      setDeliveryMethod("pickup");
    }
    if (deliveryMethod === "pickup" && !pickupEnabled && deliveryEnabled) {
      setDeliveryMethod("shipping");
    }
  }, [deliveryEnabled, pickupEnabled, deliveryMethod]);


  // Calculate final amount and currency for display & transaction
  const { finalAmount, finalCurrency, exchangeRate, isRateReady } = calculatePayment(
    orderTotal,
    items[0]?.currency,
    paymentCurrency,
    solPrice
  );

  async function checkout() {
    setFieldErrors({});

    // Determine final payment method: if pickup, force POD/POP logic
    const finalPaymentMethod = deliveryMethod === "pickup" ? "pod" : paymentMethod;

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (finalPaymentMethod === "solana" && !walletAddress) {
      setError("Wallet not ready for crypto payment. Please wait or use Pay on Delivery.");
      return;
    }

    const payload = {
      buyer: walletAddress || "",
      storeId: items[0]?.storeId || "",
      items: items.map((i) => ({ productId: i.id, qty: i.qty })),
      currency: (items[0]?.currency || "SOL") as "SOL" | "USDC",
      deliveryMethod,
      deliveryDetails: {
        ...deliveryDetails,
        address: deliveryMethod === "pickup" ? "pickup" : deliveryDetails.address,
        city: deliveryMethod === "pickup" ? "pickup" : deliveryDetails.city,
        zip: deliveryMethod === "pickup" ? "00000" : deliveryDetails.zip,
        fee: deliveryFee,
        notes: store?.delivery_notes || undefined,
      },
      paymentMethod: finalPaymentMethod,
      buyerEmail: deliveryDetails.email,
    };

    const validation = checkoutCreateSchema.safeParse(payload);

    if (!validation.success) {
      const flattened = validation.error.flatten();
      const newFieldErrors: { [key: string]: string } = {};

      if (flattened.fieldErrors.buyerEmail?.[0]) {
        newFieldErrors.email = flattened.fieldErrors.buyerEmail[0];
      }

      const detailsErrors = flattened.fieldErrors.deliveryDetails;
      if (detailsErrors && detailsErrors[0]) {
        if (!deliveryDetails.address.trim()) newFieldErrors.address = "Street address is required";
        if (!deliveryDetails.city.trim()) newFieldErrors.city = "City is required";
        if (!deliveryDetails.zip.trim()) newFieldErrors.zip = "Zip code is required";
      }

      if (!deliveryDetails.name.trim()) {
        newFieldErrors.name = "Recipient name is required";
      }

      setFieldErrors(newFieldErrors);
      setError("Please fix the highlighted fields");
      return;
    }

    try {

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
          window.location.href = `/checkout/success/${orderData.orderId}`;
        }, 3000);
        return;
      }

      // Validate Recipient Address for Crypto
      if (!orderData.payTo) {
        throw new Error("Store wallet address is missing. Cannot verify payment destination.");
      }

      // Step 2: Create Solana transaction
      // Calulated in render, but recalculate or use ref to ensure freshness? State is fine.

      // ...
      // Step 2: Create Solana transaction
      setCheckoutStatus("signing");

      // Verify rate availability if conversion needed
      if (!isRateReady && finalAmount === 0 && paymentMethod === 'solana') {
        throw new Error("Exchange rate not active. Please refresh.");
      }

      // Use the calculated amounts
      const transferAmount = finalAmount;
      let mint: string | undefined = undefined;

      if (finalCurrency === "USDC") {
        mint = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Fallback to devnet
      } else {
        mint = undefined; // SOL
      }


      const transaction = await createTransferTransaction(
        walletAddress,
        orderData.payTo,
        transferAmount,
        mint
      );
      // ... same as before


      // Step 3: Sign and send transaction
      if (!walletAddress || !signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      // Use 'as any' to bypass strict type checks between legacy/versioned if needed
      // but VersionedTransaction is generally supported by modern adapters
      const signedTx = await signTransaction(transaction as any);

      // Send transaction using our RPC connection to ensure devnet consistency
      const signature = await broadcastTransaction(signedTx);

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
        window.location.href = `/checkout/success/${orderData.orderId}`;
      }, 3000);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutStatus("error");
    }
  }

  const getButtonText = () => {
    if (checkoutStatus === "creating") return "Creating Order...";
    if (checkoutStatus === "signing") return "Check Wallet...";
    if (checkoutStatus === "confirming") return "Confirming...";
    if (checkoutStatus === "verifying") return "Verifying...";
    if (checkoutStatus === "success") return "Complete!";

    if (deliveryMethod === "pickup") return "Place Pickup Order";
    if (paymentMethod === "pod") return "Place Order (Cash on Delivery)";
    return "Checkout with Solana";
  };

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
        {(checkoutStatus !== "idle" || error) && (
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
                          {item.currency === "SOL"
                            ? `${item.price.toFixed(2)} SOL`
                            : `$${item.price.toFixed(2)}`
                          }
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
                          {item.currency === "SOL"
                            ? `${(item.price * item.qty).toFixed(2)} SOL`
                            : `$${(item.price * item.qty).toFixed(2)}`
                          }
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Delivery Method</h3>
                {deliveryUnavailable && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    This store is not accepting delivery or pickup orders right now.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button
                    onClick={() => setDeliveryMethod("shipping")}
                    disabled={!deliveryEnabled}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${deliveryMethod === "shipping"
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-border-gray hover:bg-gray-50"
                      } ${!deliveryEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">Shipping</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMethod("pickup")}
                    disabled={!pickupEnabled}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${deliveryMethod === "pickup"
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-border-gray hover:bg-gray-50"
                      } ${!pickupEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Pickup</span>
                  </button>
                </div>
                {deliveryMethod === "shipping" && store?.delivery_notes && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    {store.delivery_notes}
                  </div>
                )}

                {/* Payment Method Selection */}
                {deliveryMethod === "shipping" && items.every(i => i.isPodEnabled) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-black mb-3">Payment Method</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
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

                {paymentMethod === "solana" && deliveryMethod === "shipping" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pay With</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentCurrency("SOL")}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paymentCurrency === "SOL"
                          ? "border-primary-blue bg-blue-50 ring-1 ring-primary-blue"
                          : "border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-4 h-4" alt="SOL" />
                          </div>
                          <span className="font-medium text-sm">SOL</span>
                        </div>
                        {paymentCurrency === "SOL" && <div className="w-2 h-2 rounded-full bg-primary-blue" />}
                      </button>
                      <button
                        onClick={() => setPaymentCurrency("USDC")}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paymentCurrency === "USDC"
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                            $
                          </div>
                          <span className="font-medium text-sm">USDC</span>
                        </div>
                        {paymentCurrency === "USDC" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </button>
                    </div>
                    {solPrice && (
                      <p className="text-xs text-muted-text mt-2">
                        Exchange Rate: 1 SOL ≈ ${solPrice.toFixed(2)} USDC
                      </p>
                    )}
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
                    error={fieldErrors.email}
                  />
                  <Input
                    label="Recipient Name"
                    placeholder="Full Name"
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                    error={fieldErrors.name}
                  />
                  {deliveryMethod === "shipping" && (
                    <>
                      <Input
                        label="Street Address"
                        placeholder="123 Campus Dr"
                        value={deliveryDetails.address}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                        error={fieldErrors.address}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="City"
                          placeholder="San Francisco"
                          value={deliveryDetails.city}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                          error={fieldErrors.city}
                        />
                        <Input
                          label="Zip Code"
                          placeholder="94105"
                          value={deliveryDetails.zip}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, zip: e.target.value })}
                          error={fieldErrors.zip}
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
                    <span className="font-medium text-black">
                      {items[0]?.currency === "SOL"
                        ? `${total.toFixed(2)} SOL`
                        : `$${total.toFixed(2)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-text">Platform Fee</span>
                    <span className="font-medium text-black">
                      {items[0]?.currency === "SOL" ? "0.00 SOL" : "$0.00"}
                    </span>
                  </div>
                  {deliveryMethod === "shipping" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-text">Shipping</span>
                      <span className="font-medium text-black">
                        {items[0]?.currency === "SOL"
                          ? `${deliveryFee.toFixed(2)} SOL`
                          : `$${deliveryFee.toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border-gray pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-black">
                        Total {finalCurrency !== items[0]?.currency ? `(Pay ${finalCurrency})` : ""}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-blue block">
                          {finalCurrency === "SOL"
                            ? `${finalAmount.toFixed(4)} SOL`
                            : `$${finalAmount.toFixed(2)}`
                          }
                        </span>
                        {finalCurrency !== items[0]?.currency && (
                          <span className="text-xs text-muted-text">
                            (Original: {items[0]?.currency === "SOL" ? `${orderTotal.toFixed(2)} SOL` : `$${orderTotal.toFixed(2)}`})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => void checkout()}
                    disabled={
                      (checkoutStatus !== "idle" && checkoutStatus !== "error") ||
                      (!isRateReady && paymentMethod === 'solana') ||
                      deliveryUnavailable
                    }
                  >
                    {!isRateReady && paymentMethod === 'solana' ? "Fetching Rates..." : getButtonText()}
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

      {/* Auth Modal Triggered by Checkout */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

function calculatePayment(
  orderTotal: number,
  orderCurrency: string | undefined,
  payCurrency: "SOL" | "USDC",
  solToUsdcRate: number | null
) {
  if (!orderCurrency) return { finalAmount: orderTotal, finalCurrency: payCurrency, exchangeRate: null, isRateReady: true };

  // Case 1: Same Currency
  if (orderCurrency === payCurrency || (orderCurrency === "USD" && payCurrency === "USDC")) {
    return {
      finalAmount: orderTotal,
      finalCurrency: payCurrency,
      exchangeRate: 1,
      isRateReady: true
    };
  }

  // Case 2: Item SOL -> Pay USDC
  if (orderCurrency === "SOL" && payCurrency === "USDC") {
    if (!solToUsdcRate) return { finalAmount: 0, finalCurrency: payCurrency, exchangeRate: null, isRateReady: false };
    return {
      finalAmount: orderTotal * solToUsdcRate,
      finalCurrency: "USDC",
      exchangeRate: solToUsdcRate,
      isRateReady: true
    };
  }

  // Case 3: Item USDC/USD -> Pay SOL
  if ((orderCurrency === "USDC" || orderCurrency === "USD") && payCurrency === "SOL") {
    if (!solToUsdcRate) return { finalAmount: 0, finalCurrency: payCurrency, exchangeRate: null, isRateReady: false };
    return {
      finalAmount: orderTotal / solToUsdcRate,
      finalCurrency: "SOL",
      exchangeRate: solToUsdcRate,
      isRateReady: true
    };
  }

  return { finalAmount: orderTotal, finalCurrency: payCurrency, exchangeRate: null, isRateReady: true };
}

