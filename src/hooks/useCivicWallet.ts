import { useUser } from "@civic/auth-web3/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";

/**
 * Unified hook that combines Civic Auth user with Solana Wallet
 * Use this instead of useWallet() directly for Civic compatibility
 */
export function useCivicWallet() {
    const { user, isLoading: civicLoading } = useUser();
    const wallet = useWallet();
    const hasUpdatedProfile = useRef(false);
    const [walletUpdateAttempted, setWalletUpdateAttempted] = useState(false);

    // Check if user has embedded wallet from Civic - check multiple paths
    const civicWalletAddress = user && typeof user === 'object'
        ? (user as any).solana?.address ||
        (user as any).wallet?.address ||
        (user as any).walletAddress
        : null;

    // Get wallet address from Civic embedded wallet OR Solana wallet adapter
    const walletAddress = civicWalletAddress || wallet.publicKey?.toBase58() || null;

    // Get email from user
    const email = user && 'email' in user ? (user.email as string) : null;
    const civicUserId = user && 'sub' in user ? (user.sub as string) : null;

    // Debug logging
    useEffect(() => {
        if (user && !civicLoading) {
            console.log('[useCivicWallet] User object keys:', Object.keys(user));
            console.log('[useCivicWallet] User data:', JSON.stringify(user, null, 2).substring(0, 500));
            console.log('[useCivicWallet] Civic wallet address:', civicWalletAddress);
            console.log('[useCivicWallet] Wallet adapter address:', wallet.publicKey?.toBase58());
            console.log('[useCivicWallet] Final walletAddress:', walletAddress);
        }
    }, [user, civicLoading, civicWalletAddress, wallet.publicKey, walletAddress]);

    // Update profile with real wallet address when it becomes available
    useEffect(() => {
        // Only update if we have a REAL wallet address (not civic_ placeholder)
        const isRealWallet = walletAddress && !walletAddress.startsWith('civic_');

        if (isRealWallet && email && !hasUpdatedProfile.current && !walletUpdateAttempted) {
            hasUpdatedProfile.current = true;
            setWalletUpdateAttempted(true);

            console.log('[useCivicWallet] Updating profile with wallet:', walletAddress);

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
                    console.log('[useCivicWallet] ✅ Profile wallet address updated successfully');
                } else {
                    console.error('[useCivicWallet] ❌ Failed to update wallet, status:', res.status);
                }
            }).catch(err => {
                console.error('[useCivicWallet] ❌ Failed to update wallet address:', err);
            });
        }
    }, [walletAddress, email, civicUserId, walletUpdateAttempted]);

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
