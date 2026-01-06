import { useState, useEffect } from "react";
import { getRpc, lamportsToSol, isValidSolanaAddress } from "@/lib/solana";
import { address as solAddress, createRpc } from "@solana/kit"; // Added createRpc

export type Cluster = 'devnet' | 'mainnet';



export function useSolanaBalance(address: string | null, cluster: Cluster = 'devnet') {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setBalance(0); // Reset balance when address/cluster changes
        setError(null);

        if (!address || !isValidSolanaAddress(address)) {
            return;
        }

        let isMounted = true;
        setLoading(true);

        const rpc = getRpc(cluster);

        const fetchBalance = async () => {
            try {
                const { value: bal } = await rpc.getBalance(solAddress(address)).send();
                if (isMounted) {
                    setBalance(lamportsToSol(bal));
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to fetch balance:", err);
                    setError("Failed to fetch balance");
                    setLoading(false);
                }
            }
        };

        fetchBalance();

        // Subscribe to account changes for real-time updates
        // Note: rpcSubscriptions might need a different pattern depending on framework kit version
        // Typically: rpcSubscriptions.accountNotifications(address).subscribe(...)

        // For now, let's poll every 10 seconds as a fallback/simple solution if subscription syntax is complex
        // Framework Kit subscriptions can be tricky with correct encoding.
        const interval = setInterval(fetchBalance, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [address, cluster]);

    return { balance, loading, error };
}
