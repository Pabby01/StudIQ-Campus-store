// Solana configuration
export const SOLANA_CONFIG = {
    // Network
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",

    // Merchant wallet (receives platform fees)
    // TODO: Replace with your actual merchant wallet address
    merchantWallet: process.env.NEXT_PUBLIC_MERCHANT_WALLET || "8HzTKc1VB4zHL5NopjhFdbsq343ZWDNaAKrvTfLCv7N5",

    // Platform fee (in percentage)
    platformFeePercent: 5, // 5% platform fee

    // Transaction settings
    confirmationTimeout: 60000, // 60 seconds
    maxRetries: 3,
} as const;

// Validate merchant wallet is set
if (SOLANA_CONFIG.merchantWallet === "8HzTKc1VB4zHL5NopjhFdbsq343ZWDNaAKrvTfLCv7N5") {
    console.warn("⚠️ Merchant wallet not configured! Set NEXT_PUBLIC_MERCHANT_WALLET in .env");
}
