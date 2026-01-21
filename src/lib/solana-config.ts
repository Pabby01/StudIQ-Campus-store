// Solana configuration
export const SOLANA_CONFIG = {
    // Network
    network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as "devnet" | "mainnet",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,

    // Merchant & Platform Wallets
    merchantWallet: process.env.NEXT_PUBLIC_MERCHANT_WALLET!,
    platformWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET!,

    // Tokens
    usdcMint: process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet fallback allowed as it's public knowledge

    // Platform fee (in percentage)
    platformFeePercent: 5, // 5% platform fee

    // Transaction settings
    confirmationTimeout: 60000, // 60 seconds
    maxRetries: 3,
} as const;

// Validation: Fail fast if critical config is missing
if (typeof window === 'undefined') { // Only validate strictly on server to prevent build crashes, or check carefully
    if (!SOLANA_CONFIG.rpcUrl) {
        console.error("❌ CRITICAL: NEXT_PUBLIC_SOLANA_RPC_URL is missing in .env");
    }
    if (!SOLANA_CONFIG.merchantWallet) {
        console.error("❌ CRITICAL: NEXT_PUBLIC_MERCHANT_WALLET is missing in .env");
    }
    if (!SOLANA_CONFIG.platformWallet) {
        console.warn("⚠️ NEXT_PUBLIC_PLATFORM_WALLET is missing in .env (Swap features may fail)");
    }
}
