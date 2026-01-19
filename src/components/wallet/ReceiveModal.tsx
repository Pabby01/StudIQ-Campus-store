import { Copy, QrCode, Check, Info } from "lucide-react";
import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
    const { walletAddress } = useCivicWallet();
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Receive SOL">
            <div className="flex flex-col items-center gap-8 py-2">
                {/* QR Code Section */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="bg-gray-50/50 p-3 rounded-2xl">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`}
                                alt="Wallet QR Code"
                                className="w-44 h-44 object-contain"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                            Your Personal QR Code
                        </span>
                        <p className="text-sm text-gray-500 font-medium">Scan to send funds to this wallet</p>
                    </div>
                </div>

                {/* Address Section */}
                <div className="w-full space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Wallet Address</label>
                    </div>
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                        <div className="relative flex items-center gap-3 bg-white border border-gray-200 p-1.5 pl-4 rounded-xl shadow-sm transition-all">
                            <code className="text-[13px] font-mono font-medium text-gray-800 truncate flex-1">
                                {walletAddress}
                            </code>
                            <button
                                onClick={copyAddress}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${copied
                                        ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                        : "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 active:scale-95"
                                    }`}
                            >
                                {copied ? (
                                    <><Check className="w-3.5 h-3.5" /> Copied</>
                                ) : (
                                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notice Section */}
                <div className="w-full flex gap-3 bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl">
                    <div className="bg-blue-100 p-2 rounded-xl self-start">
                        <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-tight">Security Notice</p>
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                            Send only <strong className="font-bold">Solana (SOL)</strong> or SPL tokens to this address. Sending other assets may result in permanent loss.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
