import { useState } from "react";
import { X, Loader2, Send, CheckCircle2, AlertCircle, ArrowRight, Wallet, Info } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { createTransferTransaction, broadcastTransaction, waitForConfirmation, isValidSolanaAddress } from "@/lib/solana";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dialog from "@/components/ui/Dialog";
import { Cluster } from "@/hooks/useSolanaBalance";

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cluster: Cluster;
}

export default function SendModal({ isOpen, onClose, onSuccess, cluster }: SendModalProps) {
    const { walletAddress, signTransaction } = useCivicWallet();
    const { tokens } = useTokenBalances(walletAddress, cluster);
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedMint, setSelectedMint] = useState("SOL");
    const [status, setStatus] = useState<"idle" | "creating" | "signing" | "sending" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    // Find the currently selected token from the balances list
    const selectedToken = tokens.find(t =>
        t.mint === (selectedMint === "SOL" ? "So11111111111111111111111111111111111111112" : selectedMint)
    ) || tokens.find(t => t.symbol === "SOL");

    const balance = selectedToken?.balance || 0;
    const tokenLogo = selectedToken?.logo;
    const isSol = selectedToken?.symbol === "SOL";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (!walletAddress || !signTransaction) {
            setError("Wallet not ready. Please connect your wallet and try again.");
            setStatus("error");
            return;
        }

        const newErrors: { [key: string]: string } = {};
        const trimmedRecipient = recipient.trim();
        const amountValue = Number(amount);

        if (!trimmedRecipient) {
            newErrors.recipient = "Recipient address is required";
        } else if (!isValidSolanaAddress(trimmedRecipient)) {
            newErrors.recipient = "Invalid Solana address format";
        }

        if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
            newErrors.amount = "Enter a valid amount greater than zero";
        } else if (amountValue > balance) {
            newErrors.amount = `Amount exceeds available ${selectedToken?.symbol} balance`;
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setError("Please fix the highlighted fields");
            setStatus("error");
            return;
        }

        setStatus("creating");
        setError(null);

        try {
            const tx = await createTransferTransaction(
                walletAddress,
                trimmedRecipient,
                amountValue,
                isSol ? undefined : selectedToken?.mint,
                cluster,
                selectedToken?.decimals
            );

            setStatus("signing");
            const signedTx = await signTransaction(tx as any);

            setStatus("sending");
            const signature = await broadcastTransaction(signedTx);

            await waitForConfirmation(signature);

            setStatus("success");
            setTimeout(() => {
                onSuccess();
                onClose();
                // Reset form
                setRecipient("");
                setAmount("");
                setSelectedMint("SOL");
                setStatus("idle");
            }, 3000);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to send funds. Please check the address and balance.");
            setStatus("error");
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Send ${selectedToken?.symbol || 'SOL'}`}>
            <div className="py-2">
                {status === "success" ? (
                    <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">Transaction Sent!</h3>
                            <p className="text-gray-500 font-medium">Your funds are on their way to the network.</p>
                        </div>
                        <div className="pt-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount Sent</span>
                                <span className="text-xl font-black text-gray-900">{amount} {selectedToken?.symbol}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status !== "idle" && status !== "error" && (
                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between px-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${status === "creating" ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : "bg-green-500 text-white"}`}>
                                        {status === "creating" ? "1" : <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">PREPARE</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-gray-200 mx-2 -mt-6"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${status === "signing" ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : status === "sending" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                                        {status === "signing" ? "2" : status === "sending" ? <CheckCircle2 className="w-4 h-4" /> : "2"}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">SIGN</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-gray-200 mx-2 -mt-6"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${status === "sending" ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : "bg-gray-200 text-gray-400"}`}>
                                        3
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">SEND</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Asset</label>
                                <select
                                    className="w-full h-12 px-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                                    value={selectedMint}
                                    onChange={(e) => setSelectedMint(e.target.value)}
                                    disabled={status !== "idle" && status !== "error"}
                                >
                                    {tokens.map(token => (
                                        <option key={token.mint} value={token.symbol === "SOL" ? "SOL" : token.mint}>
                                            {token.symbol} ({token.balance.toFixed(4)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Recipient Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    <Input
                                        className="pl-11 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl font-mono text-sm"
                                        placeholder="Enter Solana Address"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        disabled={status !== "idle" && status !== "error"}
                                        error={fieldErrors.recipient}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount to Send</label>
                                    <span className="text-[10px] font-bold text-gray-400">Balance: {balance.toFixed(4)} {selectedToken?.symbol}</span>
                                </div>
                                <div className="relative">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2 py-1 shadow-sm">
                                        {tokenLogo ? (
                                            <img src={tokenLogo} alt={selectedToken?.symbol} className="w-3.5 h-3.5 object-contain" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                                        )}
                                        <span className="text-[10px] font-bold text-gray-400">{selectedToken?.symbol}</span>
                                    </div>
                                    <Input
                                        className="h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl font-bold text-lg"
                                        placeholder="0.00"
                                        type="number"
                                        step="any"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={status !== "idle" && status !== "error"}
                                        error={fieldErrors.amount}
                                    />
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-1.5 text-blue-600">
                                        <Info className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">Estimated Gas: ~0.000005 SOL</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const maxAmount = isSol ? Math.max(0, balance - 0.000005) : balance;
                                            setAmount(maxAmount.toString());
                                        }}
                                        className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase"
                                    >
                                        Use Max
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="w-full h-14 text-base font-black shadow-xl shadow-blue-200 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            disabled={(status !== "idle" && status !== "error") || !recipient || !amount}
                        >
                            {status === "idle" || status === "error" ? (
                                <>Review & Send <ArrowRight className="w-5 h-5" /></>
                            ) : (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {status === "creating" && "Preparing Transaction..."}
                                    {status === "signing" && "Awaiting Signature..."}
                                    {status === "sending" && "Broadcasting..."}
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </Dialog>
    );
}
