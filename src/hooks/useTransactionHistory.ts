import { useState, useEffect } from "react";
import { getRpc, isValidSolanaAddress } from "@/lib/solana";
import { address as solAddress } from "@solana/kit";
import { Cluster } from "@/hooks/useSolanaBalance";

export interface TransactionHistoryItem {
    signature: string;
    slot: bigint;
    err: any;
    memo: string | null;
    blockTime: bigint | null;
    status: "success" | "error" | "pending";
    date: Date | null;
}

export function useTransactionHistory(address: string | null, cluster: Cluster = 'devnet') {
    const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset history when switching clusters
        setHistory([]);
        setError(null);

        if (!address || !isValidSolanaAddress(address)) {
            return;
        }

        let isMounted = true;
        setLoading(true);

        const rpc = getRpc(cluster);

        const fetchHistory = async () => {
            try {
                const signatures = await rpc.getSignaturesForAddress(solAddress(address), { limit: 10 }).send();

                if (isMounted) {
                    const items = signatures.map(sig => ({
                        signature: sig.signature,
                        slot: sig.slot,
                        err: sig.err,
                        memo: sig.memo,
                        blockTime: sig.blockTime,
                        status: sig.err ? "error" : "success",
                        date: sig.blockTime ? new Date(Number(sig.blockTime) * 1000) : null
                    })) as TransactionHistoryItem[];

                    setHistory(items);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to fetch history:", err);
                    setError("Failed to fetch transaction history");
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        const interval = setInterval(fetchHistory, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [address, cluster]);

    return { history, loading, error };
}
