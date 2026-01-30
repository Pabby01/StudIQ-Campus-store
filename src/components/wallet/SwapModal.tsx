import { useState, useEffect } from "react";
import { ArrowDownUp, AlertCircle, Loader2, Info, ArrowDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dialog from "@/components/ui/Dialog";
import { Cluster } from "@/hooks/useSolanaBalance";
import { SOLANA_CONFIG } from "@/lib/solana-config";

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
    const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "completing" | "success" | "error">("idle");
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
                setError("Failed to fetch current exchange rate. Defaulting to cached data.");
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
            usdValue = inputAmount * exchangeRate;
            outputBeforeFee = usdValue;
        } else {
            usdValue = inputAmount;
            outputBeforeFee = inputAmount / exchangeRate;
        }

        const fee = outputBeforeFee * (PLATFORM_FEE_PERCENT / 100);
        const outputValue = outputBeforeFee - fee;

        return { output: outputValue, fee, total: outputBeforeFee, usdValue };
    };

    const { output, fee, usdValue } = calculateSwap();

    const isValid = () => {
        if (!amount || parseFloat(amount) <= 0) return false;
        if (parseFloat(amount) > fromBalance) return false;
        if (usdValue < MIN_SWAP_USD) return false;
        return true;
    };

    const handleReverse = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount("");
    };

    const handleConfirm = async () => {
        if (!isValid() || !walletAddress || !signTransaction) return;

        setSwapping(true);
        setStatus("preparing");
        setError(null);

        try {
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
                throw new Error(data.error || "Failed to initialize swap request");
            }

            const { swap } = await createRes.json();
            const swapId = swap.id;

            const platformWallet = SOLANA_CONFIG.platformWallet;
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
                const usdcMint = SOLANA_CONFIG.usdcMint;
                userTx = await createSplTransferTransaction(
                    walletAddress,
                    platformWallet,
                    parseFloat(amount),
                    usdcMint
                );
            }

            setStatus("signing");
            const signedTx = await signTransaction(userTx);

            setStatus("completing");
            const serialized = signedTx.serialize();
            const txArray = Array.from(serialized);

            const completeRes = await fetch("/api/swap/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    swapId,
                    userSignedTx: txArray,
                }),
            });

            if (!completeRes.ok) {
                const data = await completeRes.json();
                throw new Error(data.error || "Final swap confirmation failed");
            }

            setStatus("success");
            setTimeout(() => {
                onSuccess();
                onClose();
                setStatus("idle");
                setAmount("");
                setSwapping(false);
            }, 3000);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "The swap could not be completed at this time.");
            setStatus("error");
            setSwapping(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Swap Assets">
            <div className="py-1">
                {status === "success" ? (
                    <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in-95">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Swap Complete!</h3>
                            <p className="text-gray-500 font-medium leading-relaxed px-8">
                                Your assets have been swapped successfully and will reflect in your balance shortly.
                            </p>
                        </div>
                        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex justify-center items-center gap-4 mx-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent</p>
                                <p className="text-sm font-black text-gray-800">{amount} {fromToken}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
                                <p className="text-sm font-black text-gray-800">~{output.toFixed(4)} {toToken}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Token Input Section */}
                        <div className="space-y-1 relative">
                            {/* From Card */}
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 transition-all hover:bg-gray-100/50">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    <span>From</span>
                                    <span>Balance: {fromBalance.toFixed(4)} {fromToken}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 min-w-[100px]">
                                        {tokens.find(t => t.symbol === fromToken)?.logo ? (
                                            <img src={tokens.find(t => t.symbol === fromToken)?.logo} alt={fromToken} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${fromToken === 'SOL' ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-green-500'}`}>
                                                {fromToken.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-black text-sm">{fromToken}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="text-2xl font-black bg-transparent border-none p-0 text-right focus:ring-0 placeholder:text-gray-300"
                                        disabled={swapping}
                                    />
                                </div>
                            </div>

                            {/* Reverse Button Overlay */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <button
                                    onClick={handleReverse}
                                    className="p-3 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-blue-600"
                                    disabled={swapping}
                                >
                                    <ArrowDownUp className="w-5 h-5" />
                                </button>
                            </div>

                            {/* To Card */}
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3 pt-8 pb-4">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    <span>To (Estimated)</span>
                                    <span>Balance: {toBalance.toFixed(4)} {toToken}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 min-w-[100px]">
                                        {tokens.find(t => t.symbol === toToken)?.logo ? (
                                            <img src={tokens.find(t => t.symbol === toToken)?.logo} alt={toToken} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${toToken === 'SOL' ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-green-500'}`}>
                                                {toToken.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-black text-sm">{toToken}</span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        {loadingRate ? (
                                            <Loader2 className="w-5 h-5 animate-spin ml-auto text-gray-300" />
                                        ) : (
                                            <span className="text-2xl font-black text-gray-900">{output.toFixed(4)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Info */}
                        {exchangeRate && (
                            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Info className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Market Analytics</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-900/40 uppercase">Best Price Found</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-xs font-medium text-blue-900/70">
                                        <span>Current Rate</span>
                                        <span className="font-bold">1 SOL ≈ {exchangeRate.toFixed(2)} USDC</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-blue-900/70">
                                        <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                                        <span className="font-bold">{fee.toFixed(4)} {toToken}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Messages */}
                        {error && (
                            <div className="bg-red-50 p-4 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-800 leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* Validation Warnings */}
                        {amount && parseFloat(amount) > fromBalance && (
                            <div className="flex items-center gap-2 text-red-600 px-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-tight">Insufficient {fromToken} Balance</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            variant="primary"
                            onClick={handleConfirm}
                            className="w-full h-14 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-100 active:scale-[0.98]"
                            disabled={!isValid() || swapping || loadingRate}
                        >
                            {swapping ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>
                                        {status === "preparing" && "Preparing..."}
                                        {status === "signing" && "Awaiting Signature..."}
                                        {status === "completing" && "Finalizing..."}
                                    </span>
                                </div>
                            ) : (
                                "Review & Swap Tokens"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
