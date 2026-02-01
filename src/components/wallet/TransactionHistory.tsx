import { useState } from "react";
import {
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import Card from "@/components/ui/Card";
import { Cluster } from "@/hooks/useSolanaBalance";

interface TransactionHistoryProps {
    address: string;
    cluster: Cluster;
}

export default function TransactionHistory({ address, cluster }: TransactionHistoryProps) {
    const { history, loading, error } = useTransactionHistory(address, cluster);
    const [expandedSignature, setExpandedSignature] = useState<string | null>(null);

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
                        {history.map((tx) => {
                            const isIncoming = tx.direction === "in";
                            const isOutgoing = tx.direction === "out";
                            const isExpanded = expandedSignature === tx.signature;

                            const arrowBg = isIncoming
                                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                : isOutgoing
                                ? "bg-gradient-to-br from-orange-500 to-red-500"
                                : "bg-gray-300";

                            const ArrowIcon = isIncoming ? ArrowDownRight : ArrowUpRight;

                            const amountLabel =
                                tx.amount !== null
                                    ? `${isIncoming ? "+" : isOutgoing ? "-" : ""}${tx.amount.toFixed(
                                          4
                                      )} ${tx.tokenSymbol}`
                                    : null;

                            let typeLabel = "Other";
                            if (tx.kind === "paj_deposit") typeLabel = "Paj Cash Deposit";
                            else if (tx.kind === "paj_withdrawal")
                                typeLabel = "Paj Cash Withdrawal";
                            else if (tx.kind === "crypto_receive") typeLabel = "Crypto Receive";
                            else if (tx.kind === "crypto_send") typeLabel = "Crypto Send";

                            const directionLabel = isIncoming
                                ? "Deposit"
                                : isOutgoing
                                ? "Withdrawal"
                                : "Other";

                            return (
                                <div
                                    key={tx.signature}
                                    className="bg-soft-gray-bg rounded-lg transition-colors"
                                >
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition-colors group"
                                        onClick={() =>
                                            setExpandedSignature((prev) =>
                                                prev === tx.signature ? null : tx.signature
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`${arrowBg} w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm`}
                                            >
                                                <ArrowIcon className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                        {directionLabel}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                                                        {typeLabel}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-mono text-xs text-gray-500">
                                                        {tx.signature.slice(0, 8)}...
                                                        {tx.signature.slice(-8)}
                                                    </span>
                                                    {amountLabel && (
                                                        <span
                                                            className={`text-xs font-semibold ${
                                                                isIncoming
                                                                    ? "text-green-600"
                                                                    : isOutgoing
                                                                    ? "text-orange-600"
                                                                    : "text-gray-600"
                                                            }`}
                                                        >
                                                            {amountLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-text mt-0.5">
                                                    {tx.date
                                                        ? tx.date.toLocaleString()
                                                        : "Date unavailable"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <a
                                                href={getExplorerUrl(tx.signature)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-blue hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                title="View on Explorer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <div className="p-1 rounded-full text-gray-500 group-hover:bg-gray-200">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-2 border-t border-gray-200 text-xs text-gray-700 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Status</span>
                                                <span className="font-semibold flex items-center gap-1">
                                                    {tx.status === "success" ? (
                                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3 text-red-500" />
                                                    )}
                                                    {tx.status === "success"
                                                        ? "Success"
                                                        : tx.status === "error"
                                                        ? "Failed"
                                                        : "Pending"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Direction</span>
                                                <span className="font-medium">{directionLabel}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Token</span>
                                                <span className="font-medium">
                                                    {tx.tokenSymbol || "Unknown"}
                                                </span>
                                            </div>
                                            {amountLabel && (
                                                <div className="flex justify-between">
                                                    <span>Net change</span>
                                                    <span
                                                        className={`font-semibold ${
                                                            isIncoming
                                                                ? "text-green-600"
                                                                : isOutgoing
                                                                ? "text-orange-600"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {amountLabel}
                                                    </span>
                                                </div>
                                            )}
                                            {tx.memo && (
                                                <div className="pt-1">
                                                    <span className="block text-[11px] text-gray-500">
                                                        Memo
                                                    </span>
                                                    <div className="mt-0.5 rounded bg-white px-2 py-1 font-mono text-[11px] text-gray-700 break-all">
                                                        {tx.memo}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
}
