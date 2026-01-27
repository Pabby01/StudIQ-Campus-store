import { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Cluster } from "./useSolanaBalance";

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
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png"
    },
    // Devnet USDC
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": {
        symbol: "USDC",
        name: "USD Coin (Dev)",
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
    },
    // Mainnet USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
        symbol: "USDC",
        name: "USD Coin",
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
    },
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
        symbol: "USDT",
        name: "USDT",
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png"
    },
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {
        symbol: "BONK",
        name: "Bonk",
        logo: "https://h6pumh4vcbp76v6j4smgh3c2id6wa2v4w4shszf3p6ioiyvbe6sa.arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"
    },
    "JUPyiwrYJFskUPiHa7hkeR8VUtkTrVMkTrD525dCor5": {
        symbol: "JUP",
        name: "Jupiter",
        logo: "https://static.jup.ag/jup/icon.png"
    },
    "ukRST9onrp8YxG6t7rS6yGvMsnfAexR5L6mYc33oStH": {
        symbol: "PYTH",
        name: "Pyth Network",
        logo: "https://raw.githubusercontent.com/pyth-network/pyth-client/main/pyth_logo.png"
    }
};

const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export function useTokenBalances(address: string | null, cluster: Cluster = 'devnet') {
    const [tokens, setTokens] = useState<TokenBalance[]>([]);
    const [totalUsd, setTotalUsd] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address) {
            setTokens([]);
            setTotalUsd(0);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchBalances = async () => {
            try {
                // Determine RPC URL based on cluster
                const rpcUrl = cluster === 'mainnet'
                    ? (process.env.NEXT_PUBLIC_MAINNET_RPC_URL || clusterApiUrl('mainnet-beta'))
                    : (process.env.NEXT_PUBLIC_DEVNET_RPC_URL || clusterApiUrl('devnet'));

                console.log(`[Wallet] Fetching balances for ${address} on ${cluster} via ${rpcUrl}`);

                const connection = new Connection(rpcUrl, 'confirmed');
                const pubKey = new PublicKey(address);

                // 1. Fetch SOL Balance
                const solBalanceLamports = await connection.getBalance(pubKey);
                const solBalance = solBalanceLamports / 1e9;
                console.log(`[Wallet] SOL Balance: ${solBalance}`);

                // 2. Fetch Token Accounts (Standard + Token 2022)
                const [standardAccounts, token2022Accounts] = await Promise.all([
                    connection.getParsedTokenAccountsByOwner(pubKey, { programId: TOKEN_PROGRAM_ID }),
                    connection.getParsedTokenAccountsByOwner(pubKey, { programId: TOKEN_2022_PROGRAM_ID })
                ]);

                const allAccounts = [...standardAccounts.value, ...token2022Accounts.value];

                const rawTokens = allAccounts.map((account) => {
                    const info = account.account.data.parsed.info;
                    return {
                        mint: info.mint,
                        balance: info.tokenAmount.uiAmount,
                        decimals: info.tokenAmount.decimals,
                    };
                }).filter(t => t.balance > 0);

                console.log(`[Wallet] Found ${rawTokens.length} tokens`);

                // 3. Fetch Prices
                // Use Mainnet SOL Mint for price reference even on Devnet
                const mintsToPrice = [SOL_MINT];

                // If on Mainnet, include all mints. If Devnet, only SOL (and maybe some known mapped ones if we wanted)
                if (cluster === 'mainnet') {
                    mintsToPrice.push(...rawTokens.map(t => t.mint));
                }

                // Chunk price requests if too many? Jupiter supports many.
                const priceIds = mintsToPrice.join(",");
                let priceData: any = {};

                try {
                    const priceRes = await fetch(`https://api.jup.ag/price/v2/full?ids=${priceIds}`);
                    const json = await priceRes.json();
                    priceData = json.data;
                } catch (e) {
                    console.warn("Failed to fetch prices:", e);
                }

                const finalTokens: TokenBalance[] = [];


                // Add SOL
                let solPrice = parseFloat(priceData?.[SOL_MINT]?.price || "0");

                // Fallback for Devnet/Testnet if mainnet price fetch blocked or empty
                if (solPrice === 0) {
                    console.warn("[Wallet] Failed to fetch SOL price, using fallback");
                    solPrice = 145.50; // Approximate fallback
                }

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
                    const meta = COMMON_TOKENS[t.mint] || { symbol: t.mint.slice(0, 4), name: "Unknown Token", logo: "" };

                    // Simple price logic: 
                    // If Mainnet, use fetched price.
                    // If Devnet and it's a known "USDC-Dev" mint, use USDC price? (Implementing simplified logic)
                    // For now, Devnet tokens get 0 price unless it's SOL

                    const price = parseFloat(priceData?.[t.mint]?.price || "0");

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
                if (isMounted) {
                    setError("Failed to load balances");
                    setLoading(false);
                }
            }
        };

        fetchBalances();
        const interval = setInterval(fetchBalances, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [address, cluster]); // Re-run when cluster changes

    return { tokens, totalUsd, loading, error };
}
