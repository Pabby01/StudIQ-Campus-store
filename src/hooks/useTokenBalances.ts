import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

// Basic Token Info
export interface TokenBalance {
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    price: number;
    logo?: string;
    decimals: number;
}

const COMMON_TOKENS: Record<string, { symbol: string, name: string, logo: string }> = {
    "So11111111111111111111111111111111111111112": {
        symbol: "SOL",
        name: "Solana",
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
    },
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
        symbol: "USDC",
        name: "USD Coin",
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
    },
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
        symbol: "USDT",
        name: "USDT",
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png"
    },
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {
        symbol: "BONK",
        name: "Bonk",
        logo: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"
    },
    "JUPyiwrYJFskUPiHa7hkeR8VUtkTrVMkTrD525dCor5": {
        symbol: "JUP",
        name: "Jupiter",
        logo: "https://static.jup.ag/jup/icon.png"
    }
};

const SOL_MINT = "So11111111111111111111111111111111111111112";

export function useTokenBalances(address: string | null) {
    const [tokens, setTokens] = useState<TokenBalance[]>([]);
    const [totalUsd, setTotalUsd] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setTokens([]);
            setTotalUsd(0);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchBalances = async () => {
            try {
                // Using a reliable RPC (Helius free tier or similar if mostly reading, or default)
                // Using default public RPC might be rate limited for getParsedTokenAccountsByOwner
                // Ideally use process.env.NEXT_PUBLIC_RPC_URL
                const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com");
                const pubKey = new PublicKey(address);

                // 1. Fetch SOL Balance
                const solBalanceLamports = await connection.getBalance(pubKey);
                const solBalance = solBalanceLamports / 1e9;

                // 2. Fetch Token Accounts
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
                    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                });

                const rawTokens = tokenAccounts.value.map((account) => {
                    const info = account.account.data.parsed.info;
                    return {
                        mint: info.mint,
                        balance: info.tokenAmount.uiAmount,
                        decimals: info.tokenAmount.decimals,
                    };
                }).filter(t => t.balance > 0);

                // Prepare list of IDs for Price API
                // Include SOL
                const mints = [SOL_MINT, ...rawTokens.map(t => t.mint)];

                // If using Devnet, Jupiter Price API treats "So111..." as SOL price generally (Mainnet price).
                // Devnet tokens (USDC-Dev) have different mints.
                // Jupiter Price API only supports Mainnet Mints.
                // So if we are on Devnet, we can only reliably price SOL (using mainnet SOL mint).
                // "Real" USDC on Devnet is fake.
                // I will map known Devnet USDC mints to Mainnet USDC mint for pricing purposes if possible, 
                // OR just warn that prices are simulated.
                // Assuming we want to show it works:
                // I'll try to fetch prices. If mint not found, price is 0.

                const priceIds = mints.join(",");
                const priceRes = await fetch(`https://price.jup.ag/v4/price?ids=${priceIds}`);
                const priceData = await priceRes.json(); // { data: { [mint]: { price: 123.45 } } }

                const finalTokens: TokenBalance[] = [];

                // Add SOL
                const solPrice = priceData.data?.[SOL_MINT]?.price || 0;
                finalTokens.push({
                    mint: SOL_MINT,
                    symbol: "SOL",
                    name: "Solana",
                    balance: solBalance,
                    decimals: 9,
                    price: solPrice,
                    usdValue: solBalance * solPrice,
                    logo: COMMON_TOKENS[SOL_MINT].logo
                });

                // Add SPL Tokens
                for (const t of rawTokens) {
                    // Try to resolve metadata (simple lookup)
                    // In a real app we'd use Metaplex/Jupiter Token List API
                    const meta = COMMON_TOKENS[t.mint] || { symbol: t.mint.slice(0, 4), name: "Unknown Token", logo: "" };

                    // Price
                    // On Devnet, real USDC mint is different.
                    // If we want to simulate USDC price for "fake" USDC on Devnet:
                    // We can check if symbol is USDC (if we knew it).
                    // For now, use fetched price.

                    const price = priceData.data?.[t.mint]?.price || 0;

                    finalTokens.push({
                        mint: t.mint,
                        symbol: meta.symbol,
                        name: meta.name,
                        balance: t.balance,
                        decimals: t.decimals,
                        price: price,
                        usdValue: t.balance * price,
                        logo: meta.logo
                    });
                }

                // Sort by USD value
                finalTokens.sort((a, b) => b.usdValue - a.usdValue);

                if (isMounted) {
                    setTokens(finalTokens);
                    setTotalUsd(finalTokens.reduce((sum, t) => sum + t.usdValue, 0));
                    setLoading(false);
                }

            } catch (err) {
                console.error("Failed to fetch token balances:", err);
                if (isMounted) setLoading(false);
            }
        };

        fetchBalances();
        // Refresh every 30s
        const interval = setInterval(fetchBalances, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [address]);

    return { tokens, totalUsd, loading };
}
