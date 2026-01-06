import { ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import Card from "@/components/ui/Card";
import { Cluster } from "@/hooks/useSolanaBalance";

interface TransactionHistoryProps {
    address: string;
    cluster: Cluster;
}

export default function TransactionHistory({ address, cluster }: TransactionHistoryProps) {
    const { history, loading, error } = useTransactionHistory(address, cluster);

    const getExplorerUrl = (signature: string) => {
        const baseUrl = `https://explorer.solana.com/tx/${signature}`;
        if (cluster === 'devnet') return `${baseUrl}?cluster=devnet`;
        return baseUrl; // Mainnet is default
    };

    if (loading && history.length === 0) {
        return (
            <Card className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-xl font-bold text-black mb-4">Transaction History</h3>

            <div className="space-y-4">
                {error && (
                    <div className="text-center py-4 bg-red-50 rounded-lg border border-red-100 mb-4">
                        <p className="text-red-600 font-medium mb-1">{error}</p>
                        {cluster === 'mainnet' && (
                            <p className="text-xs text-red-500/80 px-4">
                                The public Mainnet node is busy. Add a custom RPC URL to your env variables for better reliability.
                            </p>
                        )}
                    </div>
                )}

                {history.length === 0 && !loading && !error && (
                    <div className="text-center py-10 text-gray-500">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No transactions found</p>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="space-y-3">
                        {history.map((tx) => (
                            <div
                                key={tx.signature}
                                className="flex items-center justify-between p-3 bg-soft-gray-bg hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    {tx.status === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <div>
                                        <div className="font-mono text-xs text-gray-500 mb-0.5">
                                            {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                                        </div>
                                        <div className="text-xs text-muted-text">
                                            {tx.date ? tx.date.toLocaleString() : 'Date unavailable'}
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href={getExplorerUrl(tx.signature)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-blue hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                    title="View on Explorer"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
