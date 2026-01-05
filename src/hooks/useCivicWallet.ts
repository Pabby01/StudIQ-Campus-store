import { useUser } from "@civic/auth-web3/react";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Unified hook that combines Civic Auth user with Solana Wallet
 * Use this instead of useWallet() directly for Civic compatibility
 */
export function useCivicWallet() {
    const { user, isLoading: civicLoading } = useUser();
    const wallet = useWallet();

    // Check if user has embedded wallet from Civic
    const hasEmbeddedWallet = user && typeof user === 'object' && 'solana' in user;

    // Get wallet address from Civic embedded wallet or connected wallet
    const walletAddress = hasEmbeddedWallet
        ? (user as any).solana?.address
        : wallet.publicKey?.toBase58();

    return {
        // User info from Civic
        user,
        email: user && 'email' in user ? (user.email as string) : null,
        civicUserId: user && 'sub' in user ? (user.sub as string) : null,

        // Wallet info (works with both Civic embedded and direct connection)
        wallet,
        walletAddress,
        isConnected: !!walletAddress,

        // Loading states
        isLoading: civicLoading || wallet.connecting,

        // For transaction signing (Civic embedded wallet works with adapter)
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
    };
}
