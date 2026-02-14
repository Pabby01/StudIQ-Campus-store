/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
    X,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Building2
} from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import { generatePajReceipt } from "@/lib/generateReceipt";

interface RampModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType?: RampType;
}

type Step = "type" | "verify" | "otp" | "form" | "confirm" | "tracking" | "success";
type RampType = "onramp" | "offramp";

export default function RampModal({ isOpen, onClose, initialType }: RampModalProps) {
    const { walletAddress, email, signTransaction } = useCivicWallet();
    const { connection } = useConnection();
    // usage of useWallet removed to prevent conflicts with embedded wallet context

    const [step, setStep] = useState<Step>(initialType ? "verify" : "type");
    const [type, setType] = useState<RampType>(initialType || "onramp");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verification State
    const [identifier, setIdentifier] = useState(email || "");
    const [otp, setOtp] = useState("");
    const [pajToken, setPajToken] = useState<string | null>(null);

    // Form State
    const [amount, setAmount] = useState("");
    const [rates, setRates] = useState<any>(null);
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBank, setSelectedBank] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [resolvedAccount, setResolvedAccount] = useState<any>(null);

    // Order State
    const [order, setOrder] = useState<any>(null);
    const [lastResolvedParams, setLastResolvedParams] = useState<string>("");
    const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
    const trackingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchRates();
            setError(null);
            setLastResolvedParams("");
            setTransactionStatus(null);
            if (initialType) {
                setType(initialType);
                setStep("verify");
                setPajToken(null);
            } else {
                setStep("type");
            }
        } else {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
                trackingIntervalRef.current = null;
            }
            setTransactionStatus(null);
        }
    }, [isOpen, initialType]);

    useEffect(() => {
        return () => {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
                trackingIntervalRef.current = null;
            }
        };
    }, []);

    const fetchRates = async () => {
        try {
            const res = await fetch("/api/ramp/rates");
            const data = await res.json();
            if (data.success) setRates(data.rates);
        } catch (err) {
            console.error("Failed to fetch rates", err);
        }
    };

    const handleInitiate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ramp/initiate", {
                method: "POST",
                body: JSON.stringify({ identifier }),
            });
            const data = await res.json();
            if (data.success) {
                setStep("otp");
            } else {
                setError(data.error);
            }
        } catch {
            setError("Failed to initiate verification");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ramp/verify", {
                method: "POST",
                body: JSON.stringify({ identifier, otp }),
            });
            const data = await res.json();
            if (data.success) {
                setPajToken(data.response.token);
                if (type === "offramp") {
                    fetchBanks(data.response.token);
                }
                setStep("form");
            } else {
                setError(data.error);
            }
        } catch {
            setError("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async (token: string) => {
        try {
            const res = await fetch(`/api/ramp/banks?token=${encodeURIComponent(token)}`);
            const data = await res.json();
            if (data.success) {
                const sortedBanks = data.banks.sort((a: any, b: any) =>
                    a.name.localeCompare(b.name)
                );
                setBanks(sortedBanks);
            }
        } catch (err) {
            console.error("Failed to fetch banks", err);
        }
    };

    const handleResolveAccount = useCallback(async () => {
        const currentParams = `${selectedBank}-${accountNumber}`;

        if (!pajToken || !selectedBank || accountNumber.length < 10) {
            return;
        }

        if (lastResolvedParams === currentParams) {
            return;
        }

        if (loading) {
            return;
        }

        setLoading(true);
        setResolvedAccount(null);

        try {
            const res = await fetch("/api/ramp/resolve-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: pajToken,
                    bankId: selectedBank,
                    accountNumber,
                }),
            });

            if (!res.ok) {
                setError("Failed to resolve account");
                return;
            }

            const data = await res.json();

            if (data.success) {
                setResolvedAccount(data.account);
                setLastResolvedParams(currentParams);
            } else {
                console.warn("[Ramp] Rate/Account resolve failed:", data.error);
                setResolvedAccount(null);
                setError(typeof data.error === "string" ? data.error : "Failed to resolve account");
            }
        } catch (err) {
            console.error("Failed to resolve account", err);
        } finally {
            setLoading(false);
        }
    }, [accountNumber, selectedBank, pajToken, lastResolvedParams, loading]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (accountNumber.length >= 10 && selectedBank && pajToken) {
                handleResolveAccount();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [accountNumber, selectedBank, pajToken, handleResolveAccount]);

    const handleCreateOrder = async () => {
        if (type === "offramp" && !walletAddress) {
            console.error("No wallet address found!");
            setError("Wallet not connected. Please connect your wallet.");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (type === 'offramp' && !resolvedAccount) {
            setError("Please wait for account resolution to complete");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const orderData: any = {
                currency: "NGN",
                mint: SOLANA_CONFIG.usdcMint,
            };

            if (type === "onramp") {
                orderData.fiatAmount = parseFloat(amount);
                orderData.recipient = walletAddress;
            } else {
                orderData.amount = parseFloat(amount);
                orderData.bankId = selectedBank;
                orderData.accountNumber = accountNumber;
                orderData.recipient = walletAddress;
            }

            // 1. Create the Order
            const res = await fetch("/api/ramp/orders", {
                method: "POST",
                body: JSON.stringify({
                    type,
                    token: pajToken,
                    data: orderData
                }),
            });
            const data = await res.json();

            if (data.success) {
                const createdOrder = data.order;
                setOrder(createdOrder);

                if (type === "offramp") {
                    const depositAddress = createdOrder.address || createdOrder.walletAddress;

                    if (!depositAddress) {
                        throw new Error("No deposit address received from Paj Cash");
                    }

                    const destinationPubkey = new PublicKey(depositAddress);
                    const usdcMintPubkey = new PublicKey(SOLANA_CONFIG.usdcMint);
                    const amountInBaseUnits = Math.floor(parseFloat(amount) * 1_000_000); // 6 decimals for USDC

                    // Use the wallet address from Civic hook
                    const userPublicKey = new PublicKey(walletAddress!);

                    const sourceATA = await getAssociatedTokenAddress(usdcMintPubkey, userPublicKey);
                    const destATA = await getAssociatedTokenAddress(usdcMintPubkey, destinationPubkey);

                    const sourceInfo = await connection.getAccountInfo(sourceATA);
                    if (!sourceInfo) {
                        throw new Error("No USDC token account found. Receive USDC before withdrawing.");
                    }

                    const [destInfo, sourceBalance] = await Promise.all([
                        connection.getAccountInfo(destATA),
                        connection.getTokenAccountBalance(sourceATA)
                    ]);

                    const availableBalance = sourceBalance.value.uiAmount ?? 0;
                    const requestedAmount = parseFloat(amount);
                    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
                        throw new Error("Please enter a valid amount");
                    }
                    if (availableBalance < requestedAmount) {
                        throw new Error(`Insufficient USDC balance. Available: ${availableBalance.toFixed(2)} USDC`);
                    }

                    const transaction = new Transaction();
                    if (!destInfo) {
                        transaction.add(
                            createAssociatedTokenAccountInstruction(
                                userPublicKey,
                                destATA,
                                destinationPubkey,
                                usdcMintPubkey
                            )
                        );
                    }
                    transaction.add(
                        createTransferInstruction(
                            sourceATA,
                            destATA,
                            userPublicKey,
                            amountInBaseUnits,
                            [],
                            TOKEN_PROGRAM_ID
                        )
                    );

                    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    transaction.feePayer = userPublicKey;

                    if (!signTransaction) {
                        throw new Error("Signer not available");
                    }

                    const signedTx = await signTransaction(transaction);
                    const signature = await connection.sendRawTransaction(signedTx.serialize());

                    await connection.confirmTransaction(signature, "confirmed");

                    if (createdOrder.id) {
                        startStatusTracking(createdOrder.id);
                    } else {
                        setStep("success");
                    }
                } else {
                    setStep("confirm");
                }
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            if (err?.getLogs) {
                try {
                    const logs = await err.getLogs(connection);
                    console.error("Order failed logs", logs);
                } catch (logError) {
                    console.error("Order failed log fetch error", logError);
                }
            }
            console.error("Order failed", err);
            setError(err?.message || "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const startStatusTracking = (orderId: string) => {
        if (!orderId) return;

        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }

        setStep("tracking");
        setTransactionStatus("PROCESSING");

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/ramp/status?id=${encodeURIComponent(orderId)}`);
                if (!res.ok) {
                    return;
                }
                const data = await res.json();
                if (!data.success || !data.transaction) {
                    return;
                }

                const currentStatus = data.transaction.status as string | null;
                if (currentStatus) {
                    setTransactionStatus(currentStatus);
                }

                const normalized = currentStatus?.toUpperCase();
                if (normalized === "COMPLETED") {
                    setOrder((prev: any) => prev ? { ...prev, status: "COMPLETED" } : prev);
                    if (trackingIntervalRef.current) {
                        clearInterval(trackingIntervalRef.current);
                        trackingIntervalRef.current = null;
                    }
                    setStep("success");
                }
            } catch (err) {
                console.error("Failed to check Paj transaction status", err);
            }
        };

        checkStatus();
        const intervalId = window.setInterval(checkStatus, 5000);
        trackingIntervalRef.current = intervalId;
    };

    const mapStatusForReceipt = (status?: string | null) => {
        if (!status) return "Processing";
        const normalized = status.toUpperCase();
        if (normalized === "INIT") return "Processing";
        if (normalized === "PAID") return "Processing";
        if (normalized === "COMPLETED") return "Completed";
        return status;
    };

    const handleDownloadReceipt = () => {
        if (!order) return;

        try {
            const receiptType = type === "onramp" ? "deposit" : "withdrawal";
            const baseId = order.id || order.reference || order.address || String(Date.now());
            const baseIdString = typeof baseId === "string" ? baseId : String(baseId);
            const trackingCode = `PAJ-${receiptType === "deposit" ? "IN" : "OUT"}-${baseIdString.slice(-8).toUpperCase()}`;

            const rawNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
            const isMainnet = rawNetwork === "mainnet" || rawNetwork === "mainnet-beta";
            const network = isMainnet ? "mainnet-beta" : "devnet";

            const statusForReceipt = mapStatusForReceipt(order.status);

            const parsedAmount = parseFloat(amount || "0");
            const onRampRate = rates?.onRampRate?.rate || 0;
            const offRampRate = rates?.offRampRate?.rate || 0;

            const amountFiat =
                type === "onramp"
                    ? parsedAmount
                    : order.fiatAmount ?? (offRampRate > 0 ? parsedAmount * offRampRate : parsedAmount);

            const amountToken =
                type === "onramp"
                    ? (typeof order.tokenAmount === "number" && order.tokenAmount > 0
                        ? order.tokenAmount
                        : onRampRate > 0
                            ? parsedAmount / onRampRate
                            : parsedAmount)
                    : parsedAmount;

            generatePajReceipt({
                id: baseIdString,
                date: new Date(),
                type: receiptType,
                userAddress: walletAddress || "",
                userName: identifier || null,
                amountFiat,
                fiatCurrency: order.currency || "NGN",
                amountToken,
                tokenSymbol: "USDC",
                pajOrderId: order.id || "",
                trackingCode,
                network,
                status: statusForReceipt,
            });
        } catch (receiptError) {
            console.error("Failed to generate Paj Cash receipt", receiptError);
        }
    };

    if (!isOpen) return null;

    const isOnramp = type === "onramp";
    const themeColor = isOnramp ? "green" : "orange";
    const gradientFrom = isOnramp ? "from-green-500" : "from-orange-500";
    const gradientTo = isOnramp ? "to-emerald-600" : "to-red-600";
    const bgGradient = isOnramp ? "from-green-500/5 to-emerald-500/5" : "from-orange-500/5 to-red-500/5";
    const borderOne = isOnramp ? "border-green-100" : "border-orange-100";

    // Dynamic Button Class
    const buttonClass = `bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 text-white shadow-lg ${isOnramp ? 'shadow-green-500/20' : 'shadow-orange-500/20'} border-none`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={onClose}
        >
            <Card
                className="w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    {/* Header */}
                    <div className={`mb-8 p-6 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 bg-gradient-to-r ${bgGradient} border-b ${isOnramp ? 'border-green-500/10' : 'border-orange-500/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2.5 bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white rounded-xl shadow-lg`}>
                                {isOnramp ? <ArrowDownCircle className="w-6 h-6" /> : <ArrowUpCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
                                    {isOnramp ? "Buy Crypto" : "Sell Crypto"}
                                </h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isOnramp ? 'text-green-600' : 'text-orange-600'}`}>
                                    {isOnramp ? "Bank Transfer ➔ Wallet" : "Wallet ➔ Bank Transfer"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-fadeIn">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Step: Select Type */}
                    {step === "type" && (
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => { setType("onramp"); setStep("verify"); }}
                                className="group p-6 border-2 border-gray-100 hover:border-green-500/50 hover:bg-green-50/50 rounded-2xl transition-all text-left relative overflow-hidden shadow-sm hover:shadow-md"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/20 transition-colors"></div>
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="p-3 bg-green-100/50 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                                        <ArrowDownCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-[10px] font-black text-green-700 uppercase tracking-widest bg-green-100 px-2 py-1 rounded-md">Best Rate</div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1 relative z-10">Buy with Naira</h3>
                                <p className="text-sm text-gray-500 leading-relaxed relative z-10">Deposit Naira from your bank account to receive USDC instantly.</p>
                            </button>

                            <button
                                onClick={() => { setType("offramp"); setStep("verify"); }}
                                className="group p-6 border-2 border-gray-100 hover:border-orange-500/50 hover:bg-orange-50/5 rounded-2xl transition-all text-left relative overflow-hidden shadow-sm hover:shadow-md"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-colors"></div>
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="p-3 bg-orange-100/50 rounded-xl group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-500 group-hover:text-white transition-all duration-300">
                                        <ArrowUpCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-[10px] font-black text-orange-700 uppercase tracking-widest bg-orange-100 px-2 py-1 rounded-md">Instant Cash</div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1 relative z-10">Sell for Naira</h3>
                                <p className="text-sm text-gray-500 leading-relaxed relative z-10">Sell your USDC and receive Naira directly in your bank account.</p>
                            </button>
                        </div>
                    )}

                    {/* Step: Verification Input */}
                    {step === "verify" && (
                        <div className="space-y-6">
                            <Input
                                label="Email or Phone Number"
                                placeholder="example@mail.com or +234..."
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                description="We'll send a verification OTP to this address"
                                className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                            />
                            <div className="flex flex-col gap-3">
                                <Button
                                    className={`${buttonClass} h-12 rounded-xl font-bold`}
                                    fullWidth
                                    onClick={handleInitiate}
                                    disabled={loading || !identifier}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Code"}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("type")} className="h-12 rounded-xl text-gray-500 hover:text-gray-900">
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: OTP Input */}
                    {step === "otp" && (
                        <div className="space-y-6">
                            <Input
                                label="Verification Code"
                                placeholder="Enter 4-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={4}
                                className="bg-gray-50/50 text-center tracking-[0.5em] font-mono text-lg"
                            />
                            <div className="flex flex-col gap-3">
                                <Button
                                    className={`${buttonClass} h-12 rounded-xl font-bold`}
                                    fullWidth
                                    onClick={handleVerify}
                                    disabled={loading || otp.length < 4}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("verify")} className="h-12 rounded-xl text-gray-500 hover:text-gray-900">
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: Transaction Form */}
                    {step === "form" && (
                        <div className="space-y-6">
                            {type === "onramp" ? (
                                <Input
                                    label="Amount to Buy (Naira)"
                                    placeholder="e.g. 50000"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    suffix="NGN"
                                    className="bg-gray-50/50 border-gray-200 focus:ring-green-500/20"
                                />
                            ) : (
                                <div className="space-y-6">
                                    <Input
                                        label="Amount to Sell (USDC)"
                                        placeholder="e.g. 50"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        suffix="USDC"
                                        className="bg-gray-50/50 border-gray-200 focus:ring-orange-500/20"
                                    />

                                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isOnramp ? 'text-green-700' : 'text-orange-700'}`}>
                                            <Building2 className="w-4 h-4" />
                                            Destination Bank Account
                                        </h4>
                                        <div className="grid gap-4">
                                            <select
                                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                                                value={selectedBank}
                                                onChange={(e) => setSelectedBank(e.target.value)}
                                            >
                                                <option value="">Select Bank</option>
                                                {banks.map(bank => (
                                                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                                                ))}
                                            </select>
                                            <Input
                                                placeholder="Account Number"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                maxLength={10}
                                                className="bg-gray-50/50"
                                            />
                                            {resolvedAccount && (
                                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${isOnramp ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                                    <div className={`p-2 rounded-full ${isOnramp ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isOnramp ? 'text-green-700' : 'text-orange-700'}`}>Verified Account</p>
                                                        <p className={`text-sm font-bold ${isOnramp ? 'text-green-900' : 'text-orange-900'}`}>{resolvedAccount.accountName}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {rates && (
                                <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Exchange Rate</span>
                                        <span className="font-bold text-gray-900">₦{type === 'onramp' ? rates.onRampRate?.rate : rates.offRampRate?.rate} / USD</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200/50">
                                        <span className="text-gray-500 uppercase tracking-wider text-xs font-bold">You will receive</span>
                                        <span className={`font-bold text-lg ${isOnramp ? 'text-green-600' : 'text-orange-600'}`}>
                                            {type === 'onramp'
                                                ? `${(parseFloat(amount || "0") / (rates.onRampRate?.rate || 1)).toFixed(2)} USDC`
                                                : `₦${(parseFloat(amount || "0") * (rates.offRampRate?.rate || 1)).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    className={`${buttonClass} h-12 rounded-xl font-bold`}
                                    fullWidth
                                    onClick={handleCreateOrder}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Initiate ${type === 'onramp' ? 'Purchase' : 'Sale'}`}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("type")} className="h-12 rounded-xl text-gray-500 hover:text-gray-900">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: Confirmation */}
                    {step === "confirm" && order && (
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl text-center relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}></div>
                                <p className="text-sm text-gray-500 mb-2">Transaction Initiated</p>
                                <p className={`text-3xl font-black mb-4 ${isOnramp ? 'text-green-600' : 'text-orange-600'}`}>
                                    {isOnramp ? `₦${parseFloat(amount).toLocaleString()}` : `${order.amount} USDC`}
                                </p>

                                <div className="space-y-4 pt-4 border-t border-gray-200/50 text-left">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                                        <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">Processing</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Order ID</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono tracking-wider">#{order.id?.slice(0, 8)}</span>
                                    </div>
                                    {isOnramp && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Bank</span>
                                                <span className="text-sm font-semibold text-gray-900">{order.bank}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Account Name</span>
                                                <span className="text-sm font-semibold text-gray-900">{order.accountName}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Account Number</span>
                                                <span className="text-sm font-mono font-bold text-gray-900 tracking-wider">
                                                    {order.accountNumber}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button
                                className={`${buttonClass} h-12 rounded-xl font-bold`}
                                fullWidth
                                onClick={() => {
                                    if (order?.id) {
                                        startStatusTracking(order.id);
                                    }
                                }}
                            >
                                I have completed the transfer
                            </Button>
                        </div>
                    )}

                    {/* Step: Tracking */}
                    {step === "tracking" && (
                        <div className="text-center py-8">
                            <div className="relative inline-block mb-8">
                                <div className={`absolute inset-0 blur-2xl rounded-full animate-pulse ${isOnramp ? 'bg-green-500/20' : 'bg-orange-500/20'}`}></div>
                                <div className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border-4 border-white ${isOnramp ? 'bg-green-100' : 'bg-orange-100'}`}>
                                    <Loader2 className={`w-10 h-10 animate-spin ${isOnramp ? 'text-green-600' : 'text-orange-600'}`} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                                {isOnramp ? "Confirming your payment" : "Processing your withdrawal"}
                            </h3>
                            <p className="text-gray-500 mb-4 max-w-[320px] mx-auto font-medium leading-relaxed">
                                We are checking with Paj Cash to confirm your {isOnramp ? "bank transfer" : "withdrawal"}.
                            </p>
                            {transactionStatus && (
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.25em]">
                                    Status: {mapStatusForReceipt(transactionStatus)}
                                </p>
                            )}
                            <div className="mt-6 flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-2xl font-bold text-sm"
                                    fullWidth
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === "success" && (
                        <div className="text-center py-8">
                            <div className="relative inline-block mb-8">
                                <div className={`absolute inset-0 blur-2xl rounded-full animate-pulse ${isOnramp ? 'bg-green-500/20' : 'bg-orange-500/20'}`}></div>
                                <div className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border-4 border-white ${isOnramp ? 'bg-green-100' : 'bg-orange-100'}`}>
                                    <CheckCircle2 className={`w-12 h-12 ${isOnramp ? 'text-green-600' : 'text-orange-600'}`} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Success! 🚀</h3>
                            <p className="text-gray-500 mb-8 max-w-[280px] mx-auto font-medium leading-relaxed">
                                Your {type === 'onramp' ? 'purchase' : 'withdrawal'} has been initiated and is being processed.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className={`${buttonClass} h-12 rounded-2xl font-bold text-lg`}
                                    fullWidth
                                    onClick={handleDownloadReceipt}
                                    disabled={!order}
                                >
                                    Download Receipt
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-2xl font-bold text-lg"
                                    fullWidth
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-2 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by</span>
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1">
                        PAJ CASH <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    </span>
                </div>
            </Card>
        </div>
    );
}
