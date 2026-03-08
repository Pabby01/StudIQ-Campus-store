/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Copy, Send, ArrowDown, Wallet, Eye, EyeOff, ChevronDown, Coins, ArrowLeftRight, ArrowUpCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import { Cluster } from "@/hooks/useSolanaBalance";
import { TokenBalance } from "@/hooks/useTokenBalances";

interface WalletCardProps {
    tokens: TokenBalance[];
    totalUsd: number;
    address: string;
    loading: boolean;
    cluster: Cluster;
    onClusterChange: (c: Cluster) => void;
    onSend: () => void;
    onReceive: () => void;
    onOnramp: () => void;
    onOfframp: () => void;
    onSwap: () => void;
}

export default function WalletCard({
    tokens,
    totalUsd,
    address,
    loading,
    cluster,
    onClusterChange,
    onSend,
    onReceive,
    onOnramp,
    onOfframp,
    onSwap
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
        <Card className="p-0 overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-sm relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-blue/10 rounded-xl">
                            <Wallet className="w-5 h-5 text-primary-blue" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-none">Civic Wallet</h3>
                            <span className="text-xs text-slate-500">Secure Storage</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-slate-600 uppercase tracking-wide">MAINNET</span>
                    </div>
                </div>

                {/* Total Balance */}
                <div className="mb-8 text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <p className="text-slate-500 mb-1 text-sm font-medium">Total Balance (Est.)</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                            {loading ? (
                                <span className="animate-pulse opacity-50">...</span>
                            ) : showBalance ? (
                                <>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)}</>
                            ) : (
                                <span className="tracking-widest opacity-40 text-3xl mt-2 block">••••••••</span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        onClick={copyAddress}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-primary-blue bg-white border border-slate-200 hover:border-primary-blue/30 px-3 py-1 rounded-full transition-all cursor-pointer shadow-sm"
                    >
                        <span className="font-mono">{shortenAddress(address)}</span>
                        <Copy className="w-3 h-3" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto mb-6">
                    <button
                        onClick={onSend}
                        className="group flex flex-col items-center justify-center gap-2"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md group-active:scale-95">
                            <Send className="w-5 h-5 md:w-6 md:h-6 text-primary-blue" />
                        </div>
                        <span className="font-medium text-slate-600 text-xs">Send</span>
                    </button>
                    
                    <button
                        onClick={onReceive}
                        className="group flex flex-col items-center justify-center gap-2"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 group-hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md group-active:scale-95">
                            <ArrowDown className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
                        </div>
                        <span className="font-medium text-slate-600 text-xs">Receive</span>
                    </button>

                    <button
                        onClick={onSwap}
                        className="group relative flex flex-col items-center justify-center gap-2"
                    >
                        <div className="absolute top-0 right-1 md:right-2 -mt-1 -mr-1 z-10">
                             <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">SOON</span>
                        </div>
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-50 group-hover:bg-purple-100 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md group-active:scale-95 opacity-80">
                            <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        </div>
                        <span className="font-medium text-slate-600 text-xs">Swap</span>
                    </button>

                    <button
                        onClick={onOfframp}
                        className="group relative flex flex-col items-center justify-center gap-2"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-50 group-hover:bg-orange-100 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md group-active:scale-95">
                            <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                        </div>
                        <span className="font-medium text-slate-600 text-xs">Withdraw</span>
                    </button>
                </div>

                <div className="max-w-sm mx-auto">
                    <button
                        onClick={onOnramp}
                        className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 relative overflow-hidden group"
                    >
                        <Wallet className="w-5 h-5" />
                        <span>Deposit w/ Naira (Paj Cash)</span>
                    </button>
                </div>

                {/* Token List removed - moved to separate component */}
            </div>
        </Card>
    );
}
