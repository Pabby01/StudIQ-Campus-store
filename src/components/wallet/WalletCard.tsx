import { useState } from "react";
import Link from "next/link";
import { Copy, Send, ArrowDown, Wallet, Eye, EyeOff, ChevronDown } from "lucide-react";
import Card from "@/components/ui/Card";
import { Cluster } from "@/hooks/useSolanaBalance";

interface WalletCardProps {
    balance: number;
    address: string;
    loading: boolean;
    cluster: Cluster;
    onClusterChange: (c: Cluster) => void;
    onSend: () => void;
    onReceive: () => void;
    onDeposit: () => void;
}

export default function WalletCard({
    balance,
    address,
    loading,
    cluster,
    onClusterChange,
    onSend,
    onReceive,
    onDeposit
}: WalletCardProps) {
    const [showBalance, setShowBalance] = useState(true);

    const shortenAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
    };

    return (
        <Card className="p-0 overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 text-white border-none shadow-xl relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-2 opacity-90">
                        <Wallet className="w-5 h-5" />
                        <span className="font-medium tracking-wide">Civic Wallet</span>
                    </div>

                    <button
                        onClick={() => onClusterChange(cluster === 'devnet' ? 'mainnet' : 'devnet')}
                        className="flex items-center gap-2 bg-black/20 hover:bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border border-white/10"
                    >
                        <div className={`w-2 h-2 rounded-full ${cluster === 'mainnet' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                        <span className="uppercase tracking-wider">{cluster}</span>
                        <ChevronDown className="w-3 h-3 opacity-75" />
                    </button>
                </div>

                <div className="mb-10 text-center">
                    <p className="text-blue-100/80 mb-2 font-medium text-sm">Total Balance</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                            {loading ? (
                                <span className="animate-pulse opacity-50">...</span>
                            ) : showBalance ? (
                                <>{balance.toFixed(4)} <span className="text-2xl opacity-60 font-medium">SOL</span></>
                            ) : (
                                <span className="tracking-widest opacity-80">••••••••</span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                        >
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        onClick={copyAddress}
                        className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-4 py-1.5 rounded-full transition-all cursor-pointer"
                    >
                        <span className="font-mono opacity-90">{shortenAddress(address)}</span>
                        <Copy className="w-3 h-3 opacity-70" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                    <button
                        onClick={onSend}
                        className="group flex flex-col items-center justify-center gap-2 bg-white text-blue-900 hover:bg-blue-50 active:scale-95 rounded-xl p-4 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                            <Send className="w-5 h-5 text-blue-700" />
                        </div>
                        <span className="font-semibold">Send</span>
                    </button>
                    <button
                        onClick={onReceive}
                        className="group flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 transition-all"
                    >
                        <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                            <ArrowDown className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-white">Receive</span>
                    </button>
                </div>

                <div className="max-w-sm mx-auto">
                    <button
                        onClick={onDeposit}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Wallet className="w-5 h-5" />
                        <span>Deposit w/ Naira (Paj Cash)</span>
                    </button>
                </div>
            </div>
        </Card>
    );
}
