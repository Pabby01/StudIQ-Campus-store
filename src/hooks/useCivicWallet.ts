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
    const hasTriedWalletCreation = useRef(false);
    const hasUpdatedProfile = useRef(false);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);

    // Get the Solana context from userContext
    const solanaContext = (userContext as any).solana;
    const walletCreationInProgress = (userContext as any).walletCreationInProgress;

    // Check if user has an embedded wallet
    const hasWallet = checkUserHasWallet(user) || (solanaContext?.address ? true : false);

    // Get wallet address from Civic's solana context or user object
    const civicWalletAddress = solanaContext?.address || (user as any)?.solana?.address || null;

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
            console.log('[useCivicWallet] solanaContext:', solanaContext);
            console.log('[useCivicWallet] solanaContext keys:', solanaContext ? Object.keys(solanaContext) : 'null');
            console.log('[useCivicWallet] walletCreationInProgress:', walletCreationInProgress);
            console.log('[useCivicWallet] createWallet on solana:', typeof solanaContext?.createWallet === 'function');
        }
    }, [user, civicLoading, hasWallet, solanaContext, walletCreationInProgress]);

    // Try to create embedded wallet if user exists but no wallet
    useEffect(() => {
        async function createEmbeddedWallet() {
            // Skip if already has wallet, already tried, or still loading
            if (hasWallet || hasTriedWalletCreation.current || isCreatingWallet || civicLoading || !user || walletCreationInProgress) {
                return;
            }

            // Check if createWallet exists on solanaContext
            if (solanaContext && typeof solanaContext.createWallet === 'function') {
                hasTriedWalletCreation.current = true;
                setIsCreatingWallet(true);

                console.log('[useCivicWallet] 🚀 Creating embedded wallet via solanaContext...');

                try {
                    await solanaContext.createWallet();
                    console.log('[useCivicWallet] ✅ Embedded wallet created!');
                } catch (error) {
                    console.error('[useCivicWallet] ❌ Wallet creation failed:', error);
                } finally {
                    setIsCreatingWallet(false);
                }
            } else {
                console.log('[useCivicWallet] ⚠️ createWallet not available on solanaContext');
                if (solanaContext) {
                    console.log('[useCivicWallet] solanaContext methods:',
                        Object.entries(solanaContext)
                            .filter(([_, v]) => typeof v === 'function')
                            .map(([k]) => k)
                    );
                }
            }
        }

        createEmbeddedWallet();
    }, [user, civicLoading, hasWallet, solanaContext, isCreatingWallet, walletCreationInProgress]);

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
        userName: userAny?.name || null,
        userPicture: userAny?.picture || null,

        // Wallet info
        wallet,
        walletAddress,
        hasEmbeddedWallet: hasWallet,
        isConnected: !!walletAddress,
        isAuthenticated: !!user,
        isCreatingWallet: isCreatingWallet || walletCreationInProgress,

        // Create wallet function for manual trigger
        createWallet: solanaContext?.createWallet,

        // Loading states
        isLoading: civicLoading || wallet.connecting || isCreatingWallet || walletCreationInProgress,

        // For transaction signing
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
    };
}
