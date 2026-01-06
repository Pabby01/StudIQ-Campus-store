import { useUser } from "@civic/auth-web3/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";

// Type guard to check if user has a solana wallet property
function checkUserHasWallet(user: any): boolean {
    return user && typeof user === 'object' && 'solana' in user && user.solana?.address;
}

/**
 * Unified hook that combines Civic Auth user with Solana Wallet
 * Automatically creates embedded wallet if not present
 */
export function useCivicWallet() {
    const userContext = useUser();
    const { user, isLoading: civicLoading } = userContext;
    const wallet = useWallet();
    const hasUpdatedProfile = useRef(false);
    const hasTriedWalletCreation = useRef(false);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);

    // Check if user has an embedded wallet
    const hasWallet = checkUserHasWallet(user);

    // Get wallet address from the user context if available
    const civicWalletAddress = hasWallet ? (user as any).solana?.address : null;

    // Get wallet address from Civic embedded wallet OR Solana wallet adapter
    const walletAddress = civicWalletAddress || wallet.publicKey?.toBase58() || null;

    // Get user info
    const userAny = user as any;
    const email = userAny?.email || null;
    const civicUserId = userAny?.id || userAny?.sub || null;

    // Debug logging
    useEffect(() => {
        if (user && !civicLoading) {
            console.log('[useCivicWallet] User exists, hasWallet:', hasWallet);
            console.log('[useCivicWallet] userContext keys:', Object.keys(userContext));
            console.log('[useCivicWallet] createWallet available:', typeof (userContext as any).createWallet === 'function');
        }
    }, [user, civicLoading, hasWallet, userContext]);

    // Try to create embedded wallet if user exists but no wallet
    useEffect(() => {
        async function createEmbeddedWallet() {
            // Skip if already has wallet, already tried, or still loading
            if (hasWallet || hasTriedWalletCreation.current || isCreatingWallet || civicLoading || !user) {
                return;
            }

            const contextAny = userContext as any;

            // Check if createWallet method exists on user context
            if (typeof contextAny.createWallet === 'function') {
                hasTriedWalletCreation.current = true;
                setIsCreatingWallet(true);

                console.log('[useCivicWallet] 🚀 Creating embedded wallet...');

                try {
                    await contextAny.createWallet();
                    console.log('[useCivicWallet] ✅ Embedded wallet created!');
                    // The userContext should now have the wallet
                } catch (error) {
                    console.error('[useCivicWallet] ❌ Wallet creation failed:', error);
                } finally {
                    setIsCreatingWallet(false);
                }
            } else {
                console.log('[useCivicWallet] ⚠️ createWallet not available on context');
                console.log('[useCivicWallet] Available methods:',
                    Object.entries(contextAny)
                        .filter(([_, v]) => typeof v === 'function')
                        .map(([k]) => k)
                );
            }
        }

        createEmbeddedWallet();
    }, [user, civicLoading, hasWallet, userContext, isCreatingWallet]);

    // Update profile with wallet address when available
    useEffect(() => {
        const isRealWallet = walletAddress && !walletAddress.startsWith('civic_');

        if (isRealWallet && email && !hasUpdatedProfile.current) {
            hasUpdatedProfile.current = true;

            console.log('[useCivicWallet] Updating profile with wallet:', walletAddress);

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
                    console.log('[useCivicWallet] ✅ Profile wallet address updated');
                } else {
                    console.error('[useCivicWallet] ❌ Failed to update wallet, status:', res.status);
                }
            }).catch(err => {
                console.error('[useCivicWallet] ❌ Failed to update wallet address:', err);
            });
        }
    }, [walletAddress, email, civicUserId]);

    return {
        // User info from Civic
        user,
        email,
        civicUserId,
        userName: user && 'name' in user ? (user.name as string) : null,
        userPicture: user && 'picture' in user ? (user.picture as string) : null,

        // Wallet info
        wallet,
        walletAddress,
        hasEmbeddedWallet: hasWallet,
        isConnected: !!walletAddress,
        isAuthenticated: !!user,
        isCreatingWallet,

        // Create wallet function for manual trigger
        createWallet: (userContext as any).createWallet,

        // Loading states
        isLoading: civicLoading || wallet.connecting || isCreatingWallet,

        // For transaction signing
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
    };
}
