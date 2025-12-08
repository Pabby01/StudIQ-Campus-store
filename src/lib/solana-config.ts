// Solana configuration
export const SOLANA_CONFIG = {
    // Network
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",

    // Merchant wallet (receives platform fees)
    // TODO: Replace with your actual merchant wallet address
    merchantWallet: process.env.NEXT_PUBLIC_MERCHANT_WALLET || "YOUR_MERCHANT_WALLET_ADDRESS_HERE",

    // Platform fee (in percentage)
    platformFeePercent: 5, // 5% platform fee

    // Transaction settings
    confirmationTimeout: 60000, // 60 seconds
    maxRetries: 3,
} as const;

// Validate merchant wallet is set
if (SOLANA_CONFIG.merchantWallet === "YOUR_MERCHANT_WALLET_ADDRESS_HERE") {
    console.warn("⚠️ Merchant wallet not configured! Set NEXT_PUBLIC_MERCHANT_WALLET in .env");
}
