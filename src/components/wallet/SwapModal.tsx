"use client";

import { useState, useEffect } from "react";
import { X, ArrowDownUp, AlertCircle, Loader2 } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Cluster } from "@/hooks/useSolanaBalance";

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cluster: Cluster;
}

type Token = "SOL" | "USDC";

const PLATFORM_FEE_PERCENT = 2; // 2% platform fee
const MIN_SWAP_USD = 1; // $1 minimum

export default function SwapModal({ isOpen, onClose, onSuccess, cluster }: SwapModalProps) {
    const { walletAddress, signTransaction } = useCivicWallet();
    const { tokens, loading: balanceLoading } = useTokenBalances(walletAddress, cluster);

    const [fromToken, setFromToken] = useState<Token>("SOL");
    const [toToken, setToToken] = useState<Token>("USDC");
    const [amount, setAmount] = useState("");
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loadingRate, setLoadingRate] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get token balances
    const fromBalance = tokens.find(t => t.symbol === fromToken)?.balance || 0;
    const toBalance = tokens.find(t => t.symbol === toToken)?.balance || 0;

    // Fetch exchange rate
    useEffect(() => {
        if (!isOpen) return;

        const fetchRate = async () => {
            setLoadingRate(true);
            try {
                const res = await fetch("/api/price/sol");
                if (!res.ok) throw new Error("Failed to fetch price");
                const data = await res.json();
                setExchangeRate(data.price);
            } catch (err) {
                console.error("Rate fetch error:", err);
                setError("Failed to fetch exchange rate");
            } finally {
                setLoadingRate(false);
            }
        };

        fetchRate();
        const interval = setInterval(fetchRate, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [isOpen]);

    // Calculate swap amounts
    const calculateSwap = () => {
        if (!amount || !exchangeRate) return { output: 0, fee: 0, total: 0, usdValue: 0 };

        const inputAmount = parseFloat(amount);
        let usdValue = 0;
        let outputBeforeFee = 0;

        if (fromToken === "SOL") {
            // SOL -> USDC
            usdValue = inputAmount * exchangeRate;
            outputBeforeFee = usdValue;
        } else {
            // USDC -> SOL
            usdValue = inputAmount;
            outputBeforeFee = inputAmount / exchangeRate;
        }

        const fee = outputBeforeFee * (PLATFORM_FEE_PERCENT / 100);
        const output = outputBeforeFee - fee;

        return { output, fee, total: outputBeforeFee, usdValue };
    };

    const { output, fee, usdValue } = calculateSwap();

    // Validation
    const isValid = () => {
        if (!amount || parseFloat(amount) <= 0) return false;
        if (parseFloat(amount) > fromBalance) return false;
        if (usdValue < MIN_SWAP_USD) return false;
        return true;
    };

    const handleSwap = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount("");
    };

    const handleConfirm = async () => {
        if (!isValid() || !walletAddress || !signTransaction) return;

        setSwapping(true);
        setError(null);

        try {
            // Step 1: Create swap record and get details
            const createRes = await fetch("/api/swap/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress,
                    fromToken,
                    toToken,
                    amount: parseFloat(amount),
                    cluster,
                }),
            });

            if (!createRes.ok) {
                const data = await createRes.json();
                throw new Error(data.error || "Failed to create swap");
            }

            const { swap } = await createRes.json();
            const swapId = swap.id;

            // Step 2: Create transaction for user to send tokens to platform
            const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js";

            // Import transaction creation functions
            const { createTransferTransaction, createSplTransferTransaction } = await import("@/lib/solana");

            let userTx;
            if (fromToken === "SOL") {
                userTx = await createTransferTransaction(
                    walletAddress,
                    platformWallet,
                    parseFloat(amount),
                    undefined,
                    cluster
                );
            } else {
                // USDC transfer
                const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
                userTx = await createSplTransferTransaction(
                    walletAddress,
                    platformWallet,
                    parseFloat(amount),
                    usdcMint
                );
            }

            // Step 3: User signs transaction
            const signedTx = await signTransaction(userTx);

            // Step 4: Send to backend to complete swap
            const completeRes = await fetch("/api/swap/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    swapId,
                    userSignedTx: signedTx.serialize(),
                }),
            });

            if (!completeRes.ok) {
                const data = await completeRes.json();
                throw new Error(data.error || "Swap completion failed");
            }

            const { userSignature, platformSignature } = await completeRes.json();

            console.log("Swap completed successfully!");
            console.log("User transaction:", userSignature);
            console.log("Platform transaction:", platformSignature);

            // Success
            onSuccess();
            onClose();
            setAmount("");
        } catch (err) {
            console.error("Swap error:", err);
            setError(err instanceof Error ? err.message : "Swap failed");
        } finally {
            setSwapping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-black">Swap Tokens</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* From Token */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">From</label>
                        <div className="relative">
                            <select
                                value={fromToken}
                                onChange={(e) => {
                                    const newFrom = e.target.value as Token;
                                    if (newFrom === toToken) {
                                        setToToken(fromToken);
                                    }
                                    setFromToken(newFrom);
                                }}
                                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent appearance-none bg-white font-medium"
                            >
                                <option value="SOL">SOL</option>
                                <option value="USDC">USDC</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                            </div>
                        </div>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-2xl font-bold"
                        />
                        <p className="text-sm text-gray-500">
                            Balance: {fromBalance.toFixed(4)} {fromToken}
                        </p>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleSwap}
                            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <ArrowDownUp className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">To</label>
                        <div className="relative">
                            <select
                                value={toToken}
                                onChange={(e) => {
                                    const newTo = e.target.value as Token;
                                    if (newTo === fromToken) {
                                        setFromToken(toToken);
                                    }
                                    setToToken(newTo);
                                }}
                                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent appearance-none bg-white font-medium"
                            >
                                <option value="SOL">SOL</option>
                                <option value="USDC">USDC</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-black">
                                {loadingRate ? "..." : output.toFixed(4)}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">
                            Balance: {toBalance.toFixed(4)} {toToken}
                        </p>
                    </div>

                    {/* Exchange Rate Info */}
                    {exchangeRate && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Exchange Rate</span>
                                <span className="font-medium text-black">
                                    1 SOL ≈ ${exchangeRate.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                                <span className="font-medium text-black">
                                    {fee.toFixed(4)} {toToken}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">USD Value</span>
                                <span className="font-medium text-black">
                                    ${usdValue.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Validation Messages */}
                    {amount && parseFloat(amount) > fromBalance && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Insufficient balance</span>
                        </div>
                    )}
                    {amount && usdValue < MIN_SWAP_USD && usdValue > 0 && (
                        <div className="flex items-center gap-2 text-yellow-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Minimum swap amount is ${MIN_SWAP_USD}</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={swapping}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirm}
                            className="flex-1"
                            disabled={!isValid() || swapping || loadingRate}
                        >
                            {swapping ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Swapping...
                                </>
                            ) : (
                                "Confirm Swap"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
