import { X, Copy, QrCode } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Button from "@/components/ui/Button";

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
    const { walletAddress } = useCivicWallet();

    if (!isOpen) return null;

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-black">Receive SOL</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="text-center space-y-6">
                    <div className="bg-gray-50 p-8 rounded-xl flex items-center justify-center">
                        {/* QR Code */}
                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-inner">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`}
                                alt="Wallet QR Code"
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Scan to send SOL</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-2">My Wallet Address</p>
                        <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between gap-2 overflow-hidden">
                            <code className="text-sm font-mono truncate text-black flex-1 text-left">
                                {walletAddress}
                            </code>
                            <button
                                onClick={copyAddress}
                                className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                                title="Copy Address"
                            >
                                <Copy className="w-4 h-4 text-primary-blue" />
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                        Send only <strong>Solana (SOL)</strong> or SPL tokens to this address. Sending other assets may result in permanent loss.
                    </div>
                </div>
            </div>
        </div>
    );
}
