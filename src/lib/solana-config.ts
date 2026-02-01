export const SOLANA_CONFIG = {
    network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as "devnet" | "mainnet",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    platformWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET!,
    usdcMint: process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    platformFeePercent: 5,
    confirmationTimeout: 60000,
    maxRetries: 3,
} as const;

if (typeof window === "undefined") {
    if (!SOLANA_CONFIG.rpcUrl) {
        console.error("❌ CRITICAL: NEXT_PUBLIC_SOLANA_RPC_URL is missing in .env");
    }
    if (!SOLANA_CONFIG.platformWallet) {
        console.warn("⚠️ NEXT_PUBLIC_PLATFORM_WALLET is missing in .env (Swap features may fail)");
    }
}
