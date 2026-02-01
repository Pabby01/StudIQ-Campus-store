import { useState, useEffect } from "react";
import { getRpc, isValidSolanaAddress, lamportsToSol, USDC_MINT, type VerifiedTransactionInfo } from "@/lib/solana";
import { address as solAddress, type Signature } from "@solana/kit";
import { Cluster } from "@/hooks/useSolanaBalance";

export type TransactionDirection = "in" | "out" | "neutral";

export type TransactionKind =
    | "paj_deposit"
    | "paj_withdrawal"
    | "crypto_receive"
    | "crypto_send"
    | "other";

export interface TransactionHistoryItem {
    signature: string;
    slot: bigint;
    err: any;
    memo: string | null;
    blockTime: bigint | null;
    status: "success" | "error" | "pending";
    date: Date | null;
    direction: TransactionDirection;
    kind: TransactionKind;
    tokenSymbol: string;
    amount: number | null;
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
                const signatures = await rpc
                    .getSignaturesForAddress(solAddress(address), { limit: 10 })
                    .send();

                const detailed = await Promise.all(
                    signatures.map(async (sig): Promise<TransactionHistoryItem> => {
                        let direction: TransactionDirection = "neutral";
                        let kind: TransactionKind = "other";
                        let tokenSymbol = "SOL";
                        let amount: number | null = null;

                        try {
                            const tx = (await rpc
                                .getTransaction(sig.signature as Signature, {
                                    maxSupportedTransactionVersion: 0,
                                    commitment: "confirmed",
                                    encoding: "jsonParsed",
                                })
                                .send()) as unknown as VerifiedTransactionInfo["transaction"];

                            if (tx && tx.meta) {
                                const accountKeys =
                                    (tx.transaction as any)?.message?.accountKeys || [];
                                const meta: any = tx.meta;

                                const index = accountKeys.findIndex((k: any) => {
                                    const value =
                                        k && typeof k === "object" && "pubkey" in k
                                            ? (k.pubkey as string)
                                            : k;
                                    return value?.toString?.() === address;
                                });

                                if (
                                    index >= 0 &&
                                    Array.isArray(meta.preBalances) &&
                                    Array.isArray(meta.postBalances)
                                ) {
                                    const pre = meta.preBalances[index];
                                    const post = meta.postBalances[index];
                                    const diffLamports = Number(post) - Number(pre);

                                    if (diffLamports !== 0) {
                                        const diffSol = lamportsToSol(diffLamports);
                                        amount = Math.abs(diffSol);
                                        tokenSymbol = "SOL";
                                        if (diffSol > 0) {
                                            direction = "in";
                                        } else if (diffSol < 0) {
                                            direction = "out";
                                        }
                                    }
                                }

                                if (direction === "neutral") {
                                    const preTokens = meta.preTokenBalances || [];
                                    const postTokens = meta.postTokenBalances || [];
                                    const balances: Record<
                                        string,
                                        { pre: number; post: number; symbol: string }
                                    > = {};

                                    for (const tb of preTokens as any[]) {
                                        if (tb.owner === address && tb.mint) {
                                            const symbol =
                                                tb.uiTokenAmount?.symbol ||
                                                (tb.mint === USDC_MINT ? "USDC" : "TOKEN");
                                            balances[tb.mint] = {
                                                pre: tb.uiTokenAmount?.uiAmount || 0,
                                                post: 0,
                                                symbol,
                                            };
                                        }
                                    }

                                    for (const tb of postTokens as any[]) {
                                        if (tb.owner === address && tb.mint) {
                                            const existing = balances[tb.mint] || {
                                                pre: 0,
                                                post: 0,
                                                symbol:
                                                    tb.uiTokenAmount?.symbol ||
                                                    (tb.mint === USDC_MINT ? "USDC" : "TOKEN"),
                                            };
                                            balances[tb.mint] = {
                                                ...existing,
                                                post: tb.uiTokenAmount?.uiAmount || 0,
                                            };
                                        }
                                    }

                                    const mintKeys = Object.keys(balances);
                                    if (mintKeys.length > 0) {
                                        const mint = mintKeys[0];
                                        const entry = balances[mint];
                                        const diff = entry.post - entry.pre;
                                        if (diff !== 0) {
                                            amount = Math.abs(diff);
                                            tokenSymbol = entry.symbol;
                                            if (diff > 0) {
                                                direction = "in";
                                            } else if (diff < 0) {
                                                direction = "out";
                                            }
                                        }
                                    }
                                }

                                if (direction === "in") {
                                    if (tokenSymbol === "USDC") {
                                        kind = "paj_deposit";
                                    } else {
                                        kind = "crypto_receive";
                                    }
                                } else if (direction === "out") {
                                    if (tokenSymbol === "USDC") {
                                        kind = "paj_withdrawal";
                                    } else {
                                        kind = "crypto_send";
                                    }
                                }
                            }
                        } catch {
                        }

                        return {
                            signature: sig.signature,
                            slot: sig.slot,
                            err: sig.err,
                            memo: sig.memo,
                            blockTime: sig.blockTime,
                            status: sig.err ? "error" : "success",
                            date: sig.blockTime
                                ? new Date(Number(sig.blockTime) * 1000)
                                : null,
                            direction,
                            kind,
                            tokenSymbol,
                            amount,
                        };
                    })
                );

                if (isMounted) {
                    setHistory(detailed);
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
