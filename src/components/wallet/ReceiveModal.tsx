import { Copy, Check, Info } from "lucide-react";
import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import Dialog from "@/components/ui/Dialog";
import { Cluster } from "@/hooks/useSolanaBalance";

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    cluster: Cluster;
}

export default function ReceiveModal({ isOpen, onClose, cluster }: ReceiveModalProps) {
    const { walletAddress } = useCivicWallet();
    const { tokens } = useTokenBalances(walletAddress, cluster);
    const [copied, setCopied] = useState(false);
    const [selectedMint, setSelectedMint] = useState("SOL");

    // Find the currently selected token from the balances list
    const selectedToken = tokens.find(t =>
        t.mint === (selectedMint === "SOL" ? "So11111111111111111111111111111111111111112" : selectedMint)
    ) || tokens.find(t => t.symbol === "SOL");

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Receive ${selectedToken?.symbol || 'SOL'}`}>
            <div className="flex flex-col items-center gap-6 py-2">
                {/* Token Selector */}
                <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Asset to Receive</label>
                    <select
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                        value={selectedMint}
                        onChange={(e) => setSelectedMint(e.target.value)}
                    >
                        {tokens.map(token => (
                            <option key={token.mint} value={token.symbol === "SOL" ? "SOL" : token.mint}>
                                {token.symbol}
                            </option>
                        ))}
                    </select>
                </div>

                {/* QR Code Section */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="relative bg-gray-50/50 p-3 rounded-2xl overflow-hidden">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${walletAddress}`}
                                alt="Wallet QR Code"
                                className="w-44 h-44 object-contain"
                            />
                            {/* Floating Coin Icon */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-lg border border-gray-100">
                                {selectedToken?.logo ? (
                                    <img
                                        src={selectedToken.logo}
                                        alt={selectedToken.symbol}
                                        className="w-6 h-6 object-contain"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                            Your {selectedToken?.symbol} QR Code
                        </span>
                        <p className="text-sm text-gray-500 font-medium text-center">Scan to send {selectedToken?.symbol} to this wallet</p>
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
                            <code className="text-[13px] font-mono font-medium text-gray-800 truncate flex-1 leading-none pt-1">
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
                            Send only <strong className="font-bold">{selectedToken?.symbol}</strong> or other Solana assets to this address. Sending other assets may result in permanent loss.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
