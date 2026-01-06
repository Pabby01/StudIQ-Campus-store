import { Coins } from "lucide-react";
import Card from "@/components/ui/Card";
import { TokenBalance } from "@/hooks/useTokenBalances";

interface TokenListProps {
    tokens: TokenBalance[];
    loading: boolean;
}

export default function TokenList({ tokens, loading }: TokenListProps) {
    return (
        <Card className="p-0 overflow-hidden bg-white border border-gray-100 shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary-blue" />
                    Your Assets
                </h3>

                <div className="space-y-1">
                    {loading && tokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-text animate-pulse">Loading assets...</div>
                    ) : tokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-text">No assets found</div>
                    ) : (
                        tokens.map((token) => (
                            <div key={token.mint} className="flex items-center justify-between p-4 hover:bg-soft-gray-bg rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 group-hover:border-primary-blue/20 transition-colors">
                                        {token.logo ? (
                                            <img src={token.logo} alt={token.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-400">{token.symbol[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-black group-hover:text-primary-blue transition-colors">{token.symbol}</div>
                                        <div className="text-xs text-muted-text">{token.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-black">
                                        {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </div>
                                    <div className="text-xs text-muted-text font-medium">
                                        ${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
