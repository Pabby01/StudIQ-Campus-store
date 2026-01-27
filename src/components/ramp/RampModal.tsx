"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
    X,
    ArrowRightLeft,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Building2,
    Wallet
} from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { SOLANA_CONFIG } from "@/lib/solana-config";

interface RampModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType?: RampType;
}

type Step = "type" | "verify" | "otp" | "form" | "confirm" | "success";
type RampType = "onramp" | "offramp";

export default function RampModal({ isOpen, onClose, initialType }: RampModalProps) {
    const { walletAddress, email } = useCivicWallet();

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

    useEffect(() => {
        if (isOpen) {
            fetchRates();
            if (initialType) {
                setType(initialType);
                setStep("verify");
            } else {
                setStep("type");
            }
        }
    }, [isOpen, initialType]);

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
        } catch (err) {
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
        } catch (err) {
            setError("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async (token: string) => {
        try {
            const res = await fetch(`/api/ramp/banks?token=${token}`);
            const data = await res.json();
            if (data.success) setBanks(data.banks);
        } catch (err) {
            console.error("Failed to fetch banks", err);
        }
    };

    const handleResolveAccount = async () => {
        if (!pajToken || !selectedBank || accountNumber.length < 10) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/ramp/banks?token=${pajToken}&bankId=${selectedBank}&accountNumber=${accountNumber}`);
            const data = await res.json();
            if (data.success) setResolvedAccount(data.account);
        } catch (err) {
            console.error("Failed to resolve account", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
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
                setOrder(data.order);
                setStep("confirm");
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full h-full sm:h-auto sm:max-w-lg relative overflow-hidden bg-white border-0 shadow-2xl sm:rounded-3xl flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-8 p-6 -mx-8 -mt-8 bg-gradient-to-r from-primary-blue/5 to-primary-blue/10 border-b border-primary-blue/10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary-blue text-white rounded-xl shadow-lg shadow-primary-blue/20">
                                <ArrowRightLeft className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Paj Cash</h2>
                                <p className="text-xs font-bold text-primary-blue uppercase tracking-widest">Naira On/Off Ramp</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Step: Select Type */}
                    {step === "type" && (
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => { setType("onramp"); setStep("verify"); }}
                                className="group p-6 border-2 border-gray-100 hover:border-green-500/50 hover:bg-green-50/50 rounded-2xl transition-all text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/10 transition-colors"></div>
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="p-3 bg-green-100/50 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                                        <ArrowDownCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-[10px] font-black text-green-700 uppercase tracking-widest bg-green-100 px-2 py-1 rounded-md">Buy Crypto</div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1 relative z-10">Onramp (Naira ➔ USDC)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed relative z-10">Deposit Naira from your bank account to receive USDC in your wallet.</p>
                            </button>

                            <button
                                onClick={() => { setType("offramp"); setStep("verify"); }}
                                className="group p-6 border-2 border-gray-100 hover:border-primary-blue/50 hover:bg-primary-blue/5 rounded-2xl transition-all text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-blue/10 transition-colors"></div>
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="p-3 bg-primary-blue/10 rounded-xl group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                                        <ArrowUpCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-[10px] font-black text-primary-blue uppercase tracking-widest bg-primary-blue/10 px-2 py-1 rounded-md">Sell Crypto</div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1 relative z-10">Offramp (USDC ➔ Naira)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed relative z-10">Sell your USDC and receive Naira directly in your local bank account.</p>
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
                            />
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleInitiate}
                                    disabled={loading || !identifier}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Code"}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("type")}>
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
                            />
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleVerify}
                                    disabled={loading || otp.length < 4}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("verify")}>
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
                                    />

                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-primary-blue" />
                                            Bank Details
                                        </h4>
                                        <div className="grid gap-4">
                                            <select
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-blue outline-none transition-all text-sm"
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
                                                onBlur={handleResolveAccount}
                                                maxLength={10}
                                            />
                                            {resolvedAccount && (
                                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Account Holder</p>
                                                    <p className="text-sm font-bold text-green-900">{resolvedAccount.accountName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {rates && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Rate</span>
                                        <span className="font-bold text-gray-900">₦{type === 'onramp' ? rates.onRampRate?.rate : rates.offRampRate?.rate} / USD</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200/50">
                                        <span className="text-gray-500 uppercase tracking-wider text-xs font-bold">You will {type === 'onramp' ? 'receive' : 'receive'}</span>
                                        <span className="font-bold text-primary-blue text-lg">
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
                                    variant="primary"
                                    fullWidth
                                    onClick={handleCreateOrder}
                                    disabled={loading || !amount}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Initiate ${type === 'onramp' ? 'Purchase' : 'Sale'}`}
                                </Button>
                                <Button variant="outline" fullWidth onClick={() => setStep("type")}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: Confirmation / Payment Details */}
                    {step === "confirm" && order && (
                        <div className="space-y-6">
                            {type === "onramp" ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-primary-blue/[0.03] border-2 border-dashed border-primary-blue/20 rounded-2xl text-center">
                                        <p className="text-sm text-gray-500 mb-2">Please transfer exactly</p>
                                        <p className="text-3xl font-bold text-primary-blue mb-4">₦{parseFloat(amount).toLocaleString()}</p>

                                        <div className="space-y-3 pt-4 border-t border-gray-200/50 text-left">
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Bank</span>
                                                <span className="text-sm font-bold text-gray-900">{order.bank || "PAJ BANK"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Account Number</span>
                                                <span className="text-sm font-bold text-gray-900 font-mono tracking-wider">{order.accountNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Account Name</span>
                                                <span className="text-sm font-bold text-gray-900">{order.accountName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                                        <p className="text-xs text-amber-800 font-medium">Auto-confirms in ~5 minutes after transfer</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="w-10 h-10 text-primary-blue" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Send USDC to Escape</h3>
                                    <p className="text-gray-500">Please send your USDC to the platform wallet to complete the offramp.</p>
                                    {/* Link to actual Solana wallet transaction trigger would go here */}
                                    <div className="p-4 bg-primary-blue/5 rounded-xl text-xs font-mono break-all text-primary-blue bg-opacity-10 border border-primary-blue/20">
                                        {SOLANA_CONFIG.platformWallet}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() => { setStep("success"); }}
                            >
                                I have completed the transfer
                            </Button>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === "success" && (
                        <div className="text-center py-8">
                            <div className="relative inline-block mb-8">
                                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Success! 🚀</h3>
                            <p className="text-gray-500 mb-8 max-w-[280px] mx-auto font-medium leading-relaxed">
                                Your {type === 'onramp' ? 'purchase' : 'withdrawal'} has been initiated and is being processed.
                            </p>
                            <Button variant="primary" fullWidth onClick={onClose} className="h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary-blue/20">
                                Awesome, Thanks!
                            </Button>
                        </div>
                    )}
                </div>

                {/* Powered by Paj Cash branding */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Powered by</span>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-primary-blue tracking-tighter">PAJ</span>
                        <span className="text-sm font-black text-gray-900 tracking-tighter">CASH</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
