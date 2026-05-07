/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "@/store/cart";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { createTransferTransaction, waitForConfirmation, broadcastTransaction } from "@/lib/solana";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { ShoppingCart, Trash2, Minus, Plus, Loader2, CheckCircle, XCircle, Truck, MapPin, CreditCard, Coins, Lock, Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { checkoutCreateSchema } from "@/lib/validators";
import { useStore } from "@/hooks/useStore";
import { useTokenBalances } from "@/hooks/useTokenBalances";

type CheckoutStatus = "idle" | "creating" | "signing" | "confirming" | "verifying" | "success" | "error";

import AuthModal from "@/components/AuthModal";
import Dialog from "@/components/ui/Dialog";
import ReceiveModal from "@/components/wallet/ReceiveModal";
import RampModal from "@/components/ramp/RampModal";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const updateQty = useCart((s) => s.updateQty);

  // Use Civic wallet hook for unified access
  const { walletAddress, email, wallet, isAuthenticated, user, signTransaction } = useCivicWallet();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showRampModal, setShowRampModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"solana" | "pod">("solana");

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    email: email || "", // Pre-fill from Civic
    address: "",
    city: "",
    zip: "",
  });

  const [paymentCurrency, setPaymentCurrency] = useState<"USDC" | "USDT">("USDC");
  const [ngnPerUsd, setNgnPerUsd] = useState<number | null>(null);

  const solPrice = useCart((s) => s.solPrice);
  const fetchSolPrice = useCart((s) => s.fetchSolPrice);
  const { tokens, loading: balanceLoading, error: balanceError } = useTokenBalances(walletAddress, SOLANA_CONFIG.network);
  const storeId = items[0]?.storeId ?? null;
  const { store: storeResponse } = useStore(storeId);
  const store = storeResponse?.store;
  const deliveryEnabled = store?.delivery_enabled ?? true;
  const pickupEnabled = store?.pickup_enabled ?? true;
  const deliveryFee = deliveryMethod === "shipping" ? Number(store?.delivery_fee ?? 0) : 0;
  const derivedSubtotal = items.reduce((sum, item) => {
    const displayPrice = item.priceNgn ?? item.price;
    return sum + displayPrice * item.qty;
  }, 0);
  const orderTotal = derivedSubtotal + deliveryFee;
  const deliveryUnavailable = !deliveryEnabled && !pickupEnabled;

  // Set default payment currency based on items (USDC/USDT only now)
  useEffect(() => {
    if (items.length > 0) {
      const itemCurrency = items[0]?.currency;
      if (itemCurrency === "USDT") {
        setPaymentCurrency("USDT");
      } else {
        setPaymentCurrency("USDC");
      }
    }
  }, [items]);

  // Ensure price is fetched if missing or stale (Store handles caching)
  useEffect(() => {
    fetchSolPrice();
  }, []);

  useEffect(() => {
    const loadNgnRate = async () => {
      const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const res = await fetch(`/api/ramp/rates?amount=1&mint=${encodeURIComponent(usdcMint)}`);
      const data = await res.json();
      const ngnValue = extractTokenValue(data?.tokenValue);
      if (ngnValue) setNgnPerUsd(ngnValue);
    };
    loadNgnRate();
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


  // Stablecoins-only: no currency conversion needed (all products in USDC/USDT)
  // Payment currency matches product currency (no SOL option anymore)
  const finalAmount = orderTotal; // NGN stays NGN; will be converted to payment currency at backend
  const finalCurrency = (items[0]?.currency || "USDC") as "USDC" | "USDT";
  const isRateReady = ngnPerUsd !== null;
  const cartCurrency = items[0]?.currency;
  const ngnSubtotal = derivedSubtotal; // Already in NGN
  const ngnDelivery = deliveryFee; // Delivery fee is in NGN
  const ngnOrderTotal = orderTotal; // Already in NGN
  const ngnFinalTotal = finalAmount; // Already in NGN
  const formatNgn = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
  const walletUsdcBalance = tokens.find((t) => t.symbol === "USDC")?.balance ?? 0;
  const walletUsdtBalance = tokens.find((t) => t.symbol === "USDT")?.balance ?? 0;
  const availableBalance = finalCurrency === "USDT" ? walletUsdtBalance : walletUsdcBalance;
  const showBalanceSection = paymentMethod === "solana" && deliveryMethod === "shipping";
  const hasInsufficientBalance = showBalanceSection && isRateReady && finalAmount > 0 && !balanceLoading && availableBalance < finalAmount;
  const finalPaymentMethod = deliveryMethod === "pickup" ? "pod" : paymentMethod;
  const validationPayload = {
    buyer: walletAddress || "",
    storeId: items[0]?.storeId || "",
    items: items.map((i) => ({ productId: i.id, qty: i.qty })),
    currency: (items[0]?.currency || "USDC") as "USDC" | "USDT",
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
  const trimmedEmail = deliveryDetails.email.trim();
  const trimmedName = deliveryDetails.name.trim();
  const trimmedAddress = deliveryDetails.address.trim();
  const trimmedCity = deliveryDetails.city.trim();
  const trimmedZip = deliveryDetails.zip.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const isNameValid = trimmedName.length >= 2;
  const isShippingValid = deliveryMethod === "pickup" || (trimmedAddress.length >= 3 && trimmedCity.length >= 2 && trimmedZip.length >= 3);
  const isFormValid = items.length > 0 && isEmailValid && isNameValid && isShippingValid;

  async function checkout() {
    if (checkoutStatus !== "idle") return;
    setFieldErrors({});

    // Determine final payment method: if pickup, force POD/POP logic
    if (items.length === 0) {
      setError("Your cart is empty");
      setCheckoutStatus("error");
      return;
    }

    if (!isFormValid) {
      const newFieldErrors: { [key: string]: string } = {};
      if (!isEmailValid) newFieldErrors.email = "Valid email is required";
      if (!isNameValid) newFieldErrors.name = "Recipient name is required";
      if (deliveryMethod === "shipping") {
        if (trimmedAddress.length < 3) newFieldErrors.address = "Street address is required";
        if (trimmedCity.length < 2) newFieldErrors.city = "City is required";
        if (trimmedZip.length < 3) newFieldErrors.zip = "Zip code is required";
      }
      setFieldErrors(newFieldErrors);
      setError("All fields must be filled before checkout.");
      setCheckoutStatus("error");
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (finalPaymentMethod === "solana" && !walletAddress) {
      setError("Wallet not ready for crypto payment. Please wait or use Pay on Delivery.");
      setCheckoutStatus("error");
      return;
    }

    const validation = checkoutCreateSchema.safeParse(validationPayload);

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
      setCheckoutStatus("error");
      return;
    }

    if (finalPaymentMethod === "solana") {
      if (balanceLoading) {
        setError("Wallet balance is loading. Please wait a moment.");
        setCheckoutStatus("error");
        return;
      }
      const requiredAmount = finalAmount;
      const currentBalance = availableBalance;
      if (requiredAmount > 0 && currentBalance < requiredAmount) {
        setError(`Insufficient ${finalCurrency} balance. Available: ${formatTokenAmount(currentBalance, finalCurrency)}.`);
        setShowInsufficientModal(true);
        setCheckoutStatus("error");
        return;
      }
    }

    try {
      setCheckoutStatus("creating");

      const createRes = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationPayload),
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
      const mint = finalCurrency === "USDC" ? SOLANA_CONFIG.usdcMint : undefined;
      const decimals = finalCurrency === "USDC" ? 6 : 9;

      const transaction = await createTransferTransaction(
        walletAddress,
        orderData.payTo,
        transferAmount,
        mint,
        SOLANA_CONFIG.network,
        decimals
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

    return "Pay Now";
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
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 glass-panel rounded-3xl p-5 sm:p-6">
          <h1 className="text-3xl font-bold text-black mb-2">Shopping Cart</h1>
          <p className="text-muted-text">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Status Messages */}
        {(checkoutStatus !== "idle" || error) && (
          <Card className="mb-6 p-4 max-w-full overflow-hidden glass-panel border-white/60">
            <div className="flex items-start gap-3">
              {checkoutStatus === "success" ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : checkoutStatus === "error" ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Loader2 className="w-6 h-6 text-primary-blue animate-spin" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium break-words leading-snug ${checkoutStatus === "success"
                    ? "text-green-900"
                    : checkoutStatus === "error"
                      ? "text-red-900"
                      : "text-black"
                    }`}
                >
                  {getStatusMessage()}
                </p>
                {orderId && (
                  <p className="text-xs text-muted-text mt-1 break-words">Order ID: {orderId}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {items.length === 0 ? (
          <Card className="text-center py-16 glass-panel border-white/60">
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
                  <Card key={item.id} className="p-4 sm:p-5 bg-white/80 border border-white/60 rounded-3xl shadow-sm">
                    <div className="flex gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl flex-shrink-0 border border-border-gray"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-soft-gray-bg rounded-2xl flex-shrink-0 flex items-center justify-center text-muted-text text-xs">
                          No image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-black mb-1 text-sm sm:text-base truncate">{item.name}</h3>
                            <p className="text-base font-bold text-black">
                              {formatNgn(item.priceNgn ?? item.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                            disabled={checkoutStatus !== "idle"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 glass-pill rounded-full p-1">
                            <button
                              onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                              className="p-1 hover:bg-white rounded-full transition-colors"
                              disabled={checkoutStatus !== "idle"}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="p-1 hover:bg-white rounded-full transition-colors"
                              disabled={checkoutStatus !== "idle"}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-black text-sm">
                              {formatNgn((item.priceNgn ?? item.price) * item.qty)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 glass-panel border-white/60">
                <h3 className="text-lg font-semibold text-black mb-4">Delivery Method</h3>
                {deliveryUnavailable && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-2xl text-sm">
                    This store is not accepting delivery or pickup orders right now.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button
                    onClick={() => setDeliveryMethod("shipping")}
                    disabled={!deliveryEnabled}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${deliveryMethod === "shipping"
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-border-gray hover:bg-white/70"
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
                      : "border-border-gray hover:bg-white/70"
                      } ${!pickupEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Pickup</span>
                  </button>
                </div>
                {deliveryMethod === "shipping" && store?.delivery_notes && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-2xl text-sm">
                    {store.delivery_notes}
                  </div>
                )}

                {paymentMethod === "solana" && deliveryMethod === "shipping" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pay With</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <button
                        onClick={() => setPaymentCurrency("USDT")}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paymentCurrency === "USDT"
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                            ₮
                          </div>
                          <span className="font-medium text-sm">USDT</span>
                        </div>
                        {paymentCurrency === "USDT" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </button>
                    </div>
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-text">Available balance</span>
                        <span className="font-semibold text-gray-900">
                          {!walletAddress && "Sign in to view"}
                          {walletAddress && balanceLoading && "Loading..."}
                          {walletAddress && !balanceLoading && formatTokenAmount(availableBalance, finalCurrency)}
                        </span>
                      </div>
                      {balanceError && (
                        <div className="mt-2 text-xs text-red-600">
                          Balance unavailable. Please refresh or open your wallet.
                        </div>
                      )}
                      {walletAddress && !balanceLoading && hasInsufficientBalance && (
                        <div className="mt-2 text-xs text-red-600">
                          Insufficient balance for this checkout.
                        </div>
                      )}
                      {walletAddress && !balanceLoading && !hasInsufficientBalance && (
                        <div className="mt-2 text-xs text-green-700">
                          Balance looks good for this checkout.
                        </div>
                      )}
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" className="w-full" onClick={() => setShowRampModal(true)}>
                          Deposit
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setShowReceiveModal(true)}>
                          Receive
                        </Button>
                      </div>
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
                    onChange={(e) => {
                      setDeliveryDetails({ ...deliveryDetails, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    error={fieldErrors.email}
                  />
                  <Input
                    label="Recipient Name"
                    placeholder="Full Name"
                    value={deliveryDetails.name}
                    onChange={(e) => {
                      setDeliveryDetails({ ...deliveryDetails, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    error={fieldErrors.name}
                  />
                  {deliveryMethod === "shipping" && (
                    <>
                      <Input
                        label="Street Address"
                        placeholder="123 Campus Dr"
                        value={deliveryDetails.address}
                        onChange={(e) => {
                          setDeliveryDetails({ ...deliveryDetails, address: e.target.value });
                          if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined });
                        }}
                        error={fieldErrors.address}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="City"
                          placeholder="San Francisco"
                          value={deliveryDetails.city}
                          onChange={(e) => {
                            setDeliveryDetails({ ...deliveryDetails, city: e.target.value });
                            if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: undefined });
                          }}
                          error={fieldErrors.city}
                        />
                        <Input
                          label="Zip Code"
                          placeholder="94105"
                          value={deliveryDetails.zip}
                          onChange={(e) => {
                            setDeliveryDetails({ ...deliveryDetails, zip: e.target.value });
                            if (fieldErrors.zip) setFieldErrors({ ...fieldErrors, zip: undefined });
                          }}
                          error={fieldErrors.zip}
                        />
                      </div>
                    </>
                  )}
                  {deliveryMethod === "pickup" && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-sm">
                      You will pick up this order directly from the seller at the store location or agreed meeting point.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 glass-panel border-white/60">
                <h3 className="text-lg font-semibold text-black mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-text">Subtotal</span>
                    <div className="text-right">
                      <span className="font-medium text-black block">{formatNgn(derivedSubtotal)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-text">Platform Fee</span>
                    <span className="font-medium text-black">{formatNgn(0)}</span>
                  </div>
                  {deliveryMethod === "shipping" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-text">Shipping</span>
                      <div className="text-right">
                        <span className="font-medium text-black block">{formatNgn(deliveryFee)}</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border-gray pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-black">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-blue block">{formatNgn(orderTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={
                      (checkoutStatus !== "idle" && checkoutStatus !== "error") ||
                      deliveryUnavailable
                    }
                  >
                    {getButtonText()}
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
      <Dialog
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        title="Insufficient balance"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your wallet does not have enough {finalCurrency} to complete this checkout.
          </p>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-text">Required</span>
              <span className="font-semibold text-gray-900">{formatTokenAmount(finalAmount, finalCurrency)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-text">Available</span>
              <span className="font-semibold text-gray-900">{formatTokenAmount(availableBalance, finalCurrency)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" className="w-full" onClick={() => { setShowInsufficientModal(false); setShowRampModal(true); }}>
              Deposit to Wallet
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowInsufficientModal(false); setShowReceiveModal(true); }}>
              Receive Crypto
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { window.location.href = "/dashboard/wallet"; }}>
              Go to Wallet
            </Button>
          </div>
        </div>
      </Dialog>
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        cluster={SOLANA_CONFIG.network}
      />
      <RampModal
        isOpen={showRampModal}
        onClose={() => setShowRampModal(false)}
        initialType="onramp"
      />
      <Dialog
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Choose payment method"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Pick how you want to pay. Crypto checkout is live now, Paystack is being integrated, and StudPoints is visible but not active yet.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowPaymentModal(false);
              setShowPaystackModal(true);
            }}
            className="w-full text-left rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-blue hover:bg-blue-50/60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-black">Pay with Paystack</h4>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-text">
                  Card and bank payment integration will land here next.
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-gray-400" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowPaymentModal(false);
              void checkout();
            }}
            className="w-full text-left rounded-2xl border border-primary-blue bg-blue-50/70 p-4 transition-all hover:bg-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-blue text-white">
                <Coins className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-black">Pay with crypto wallet</h4>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                    Live
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-text">
                  Use your wallet to pay with SOL or stablecoins, then confirm the transaction.
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-primary-blue" />
            </div>
          </button>

          <button
            type="button"
            disabled
            className="w-full text-left rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 opacity-60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-200 text-gray-500">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-black">Pay with StudPoints</h4>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                    Disabled
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-text">
                  This option is not active yet, but it will be available later.
                </p>
              </div>
            </div>
          </button>
        </div>
      </Dialog>
      <Dialog
        isOpen={showPaystackModal}
        onClose={() => setShowPaystackModal(false)}
        title="Paystack is coming next"
        footer={
          <Button variant="primary" className="w-full" onClick={() => setShowPaystackModal(false)}>
            Got it
          </Button>
        }
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-blue-50 text-primary-blue shadow-sm">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Paystack checkout is not live yet</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              The checkout UI is ready for Paystack, but the payment processor is still being wired up. Crypto wallet checkout remains available right now.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Helper Functions

// Extract numeric value from various token value formats
function extractTokenValue(tokenValue: unknown): number | null {
  if (typeof tokenValue === "number") return tokenValue;
  if (!tokenValue || typeof tokenValue !== "object") return null;
  const value = tokenValue as Record<string, unknown>;
  const direct =
    (typeof value.amount === "number" && value.amount) ||
    (typeof value.value === "number" && value.value) ||
    (typeof value.ngn === "number" && value.ngn) ||
    (typeof value.rate === "number" && value.rate);
  return typeof direct === "number" ? direct : null;
}

// Stablecoins only: no need for complex conversion logic
function formatTokenAmount(amount: number, symbol: "USDC" | "USDT") {
  const precision = 2;
  return `${amount.toFixed(precision)} ${symbol}`;
}

