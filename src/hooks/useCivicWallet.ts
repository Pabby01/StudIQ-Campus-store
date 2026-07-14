 
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const hasEstablishedSession = useRef(false);

    // Caching state for immediate rendering
    const [cachedSession, setCachedSession] = useState<{walletAddress: string | null, email: string | null}>({ walletAddress: null, email: null });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('civic_cached_session');
            if (stored) {
                try {
                    setCachedSession(JSON.parse(stored));
                } catch (e) {}
            }
        }
    }, []);

    // Get the Solana context from userContext
    const solanaContext = (userContext as any).solana;
    const walletCreationInProgress = (userContext as any).walletCreationInProgress;

    // Check if user has an embedded wallet
    const hasWallet = checkUserHasWallet(user) || (solanaContext?.address ? true : false);

    // Get wallet address from Civic's solana context or user object
    const civicWalletAddress = solanaContext?.address || (user as any)?.solana?.address || null;

    // Get active wallet address from Civic embedded wallet OR Solana wallet adapter
    const activeWalletAddress = civicWalletAddress || wallet.publicKey?.toBase58() || null;
    
    // Fallback to cached session if not yet loaded
    const walletAddress = activeWalletAddress || cachedSession.walletAddress;

    // Get user info
    const userAny = user as any;
    const activeEmail = userAny?.email || null;
    const email = activeEmail || cachedSession.email;
    const civicUserId = userAny?.id || userAny?.sub || null;

    useEffect(() => {
        if (activeWalletAddress || activeEmail) {
            localStorage.setItem('civic_cached_session', JSON.stringify({
                walletAddress: activeWalletAddress || cachedSession.walletAddress,
                email: activeEmail || cachedSession.email
            }));
        }
    }, [activeWalletAddress, activeEmail, cachedSession]);


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

                try {
                    await solanaContext.createWallet();
                } catch (error) {
                    console.error('[useCivicWallet] ❌ Wallet creation failed:', error);
                } finally {
                    setIsCreatingWallet(false);
                }
            }
        }

        createEmbeddedWallet();
    }, [user, civicLoading, hasWallet, solanaContext, isCreatingWallet, walletCreationInProgress]);

    // Get Civic token if available (usually on userContext or user)
    const token = (userContext as any).token || (userContext as any).idToken;

    // Automatic session establishment
    useEffect(() => {
        if (token && walletAddress && !civicLoading && !hasEstablishedSession.current) {
            const hasSession = typeof document !== 'undefined' && document.cookie.includes('sid=');
            if (!hasSession) {
                hasEstablishedSession.current = true;
                fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, address: walletAddress }),
                }).then(res => {
                    if (res.ok) {
                        // Trigger a small refresh or notify stats components if needed
                        // Most components will auto-retry or we can just hope for the best on next poll
                    }
                }).catch(err => {
                    console.error('[useCivicWallet] ❌ Session establishment failed:', err);
                });
            }
        }
    }, [token, walletAddress, civicLoading]);

    // Update profile with wallet address when available
    useEffect(() => {
        const isRealWallet = walletAddress && !walletAddress.startsWith('civic_');

        if (isRealWallet && email && !hasUpdatedProfile.current) {
            hasUpdatedProfile.current = true;

            fetch('/api/profile/update-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    walletAddress,
                    civicUserId,
                    token // Include token for verification
                }),
            }).then(res => {
                if (!res.ok) {
                    console.error('[useCivicWallet] ❌ Failed to update wallet, status:', res.status);
                }
            }).catch(err => {
                console.error('[useCivicWallet] ❌ Failed to update wallet address:', err);
            });
        }
    }, [walletAddress, email, civicUserId, token]);

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
        signTransaction: async (tx: any) => {
            // Priority 1: Standard Adapter
            if (wallet.connected && wallet.signTransaction) {
                return wallet.signTransaction(tx);
            }
            // Priority 2: Embedded Wallet Adapter (context.wallet)
            if (solanaContext?.wallet?.signTransaction) {
                return solanaContext.wallet.signTransaction(tx);
            }
            throw new Error("No wallet available to sign transaction");
        },
        signAllTransactions: wallet.signAllTransactions,
    };
}
