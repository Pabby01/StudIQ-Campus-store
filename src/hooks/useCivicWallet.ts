import { useUser } from "@civic/auth/react";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Unified hook that combines Civic Auth user with Solana Wallet
 * Use this instead of useWallet() directly for Civic compatibility
 * 
 * Note: With @civic/auth (non-web3), embedded wallets are not available.
 * You'll need to use a separate wallet connection for transactions.
 */
export function useCivicWallet() {
    const userContext = useUser();
    const wallet = useWallet();

    // Get user from context
    const user = userContext.user;

    // Get wallet address from connected wallet adapter
    const walletAddress = wallet.publicKey?.toBase58() || null;

    return {
        // User info from Civic Auth
        user,
        email: user && 'email' in user ? (user.email as string) : null,
        civicUserId: user && 'sub' in user ? (user.sub as string) : null,

        // Wallet info (from wallet adapter - needs separate connection)
        wallet,
        walletAddress,
        isConnected: !!walletAddress || !!user,
        isAuthenticated: !!user,

        // Loading states
        isLoading: userContext.isLoading || wallet.connecting,

        // For transaction signing
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
    };
}
