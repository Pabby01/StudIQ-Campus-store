import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { createTransferTransaction, broadcastTransaction, waitForConfirmation } from "@/lib/solana";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { Cluster } from "@/hooks/useSolanaBalance";

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cluster: Cluster;
}

export default function SendModal({ isOpen, onClose, onSuccess, cluster }: SendModalProps) {
    const { walletAddress, signTransaction } = useCivicWallet();
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState<"idle" | "creating" | "signing" | "sending" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress || !signTransaction) return;

        setStatus("creating");
        setError(null);

        try {
            // 1. Create Transaction
            const tx = await createTransferTransaction(
                walletAddress,
                recipient,
                Number(amount),
                undefined, // mint (optional)
                cluster
            );

            // 2. Sign
            setStatus("signing");
            const signedTx = await signTransaction(tx as any);

            // 3. Send
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
                setStatus("idle");
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to send");
            setStatus("error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-black">Send SOL</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {status === "success" ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-700 mb-2">Sent Successfully!</h3>
                        <p className="text-gray-500">Your transaction has been confirmed.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Recipient Address"
                            placeholder="Solana Address..."
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            disabled={status !== "idle" && status !== "error"}
                        />

                        <Input
                            label="Amount (SOL)"
                            placeholder="0.00"
                            type="number"
                            step="0.000000001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={status !== "idle" && status !== "error"}
                        />

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="w-full h-12 text-lg"
                            disabled={status !== "idle" && status !== "error"}
                        >
                            {status === "idle" || status === "error" ? (
                                <>Send SOL <Send className="w-4 h-4 ml-2" /></>
                            ) : (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    {status === "creating" && "Preparing..."}
                                    {status === "signing" && "Sign in Wallet..."}
                                    {status === "sending" && "Sending..."}
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
