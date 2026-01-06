import { useUser } from "@civic/auth-web3/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef } from "react";

/**
 * Unified hook that combines Civic Auth user with Solana Wallet
 * Use this instead of useWallet() directly for Civic compatibility
 */
export function useCivicWallet() {
    const { user, isLoading: civicLoading } = useUser();
    const wallet = useWallet();
    const hasUpdatedProfile = useRef(false);

    // Check if user has embedded wallet from Civic
    const hasEmbeddedWallet = user && typeof user === 'object' && 'solana' in user;

    // Get wallet address from Civic embedded wallet or connected wallet
    const walletAddress = hasEmbeddedWallet
        ? (user as any).solana?.address
        : wallet.publicKey?.toBase58();

    // Get email from user
    const email = user && 'email' in user ? (user.email as string) : null;
    const civicUserId = user && 'sub' in user ? (user.sub as string) : null;

    // Update profile with real wallet address when it becomes available
    useEffect(() => {
        if (walletAddress && email && !hasUpdatedProfile.current) {
            hasUpdatedProfile.current = true;

            // Update the profile with the real wallet address
            fetch('/api/profile/update-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    walletAddress,
                    civicUserId,
                }),
            }).then(res => {
                if (res.ok) {
                    console.log('[useCivicWallet] Profile wallet address updated');
                }
            }).catch(err => {
                console.error('[useCivicWallet] Failed to update wallet address:', err);
            });
        }
    }, [walletAddress, email, civicUserId]);

    return {
        // User info from Civic
        user,
        email,
        civicUserId,

        // Wallet info (works with both Civic embedded and direct connection)
        wallet,
        walletAddress,
        isConnected: !!walletAddress,
        isAuthenticated: !!user,

        // Loading states
        isLoading: civicLoading || wallet.connecting,

        // For transaction signing (Civic embedded wallet works with adapter)
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
    };
}
