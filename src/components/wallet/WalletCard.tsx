import { useState } from "react";
import { Copy, Send, ArrowDown, Wallet, Eye, EyeOff, ChevronDown, Coins } from "lucide-react";
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
    onDeposit: () => void;
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
                {/* Header */}
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

                {/* Total Balance */}
                <div className="mb-10 text-center">
                    <p className="text-blue-100/80 mb-2 font-medium text-sm">Total Balance (Est.)</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                            {loading ? (
                                <span className="animate-pulse opacity-50">...</span>
                            ) : showBalance ? (
                                <>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)}</>
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

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
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

                <div className="max-w-sm mx-auto mb-8">
                    <button
                        onClick={onDeposit}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Wallet className="w-5 h-5" />
                        <span>Deposit w/ Naira (Paj Cash)</span>
                    </button>
                </div>

                {/* Token List */}
                <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-blue-100 mb-3 flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Your Assets
                    </h3>
                    <div className="space-y-2">
                        {loading && tokens.length === 0 ? (
                            <div className="text-center py-4 text-white/50 text-sm">Loading assets...</div>
                        ) : tokens.length === 0 ? (
                            <div className="text-center py-4 text-white/50 text-sm">No assets found</div>
                        ) : (
                            tokens.map((token) => (
                                <div key={token.mint} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        {token.logo ? (
                                            <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full bg-white/10" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">
                                                {token.symbol[0]}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold text-sm">{token.symbol}</div>
                                            <div className="text-xs text-blue-200">{token.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-sm">
                                            {showBalance ? token.balance.toLocaleString() : "••••"}
                                        </div>
                                        <div className="text-xs text-blue-200">
                                            {showBalance ? `$${token.usdValue.toFixed(2)}` : "••••"}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
