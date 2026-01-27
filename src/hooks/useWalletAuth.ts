import { useWallet as useWalletAdapter } from "@solana/wallet-adapter-react";
import { useMemo, useEffect } from "react";
import { CrossAppSessionManager } from "@/lib/cross-app-session";
import { getSyncClient } from "@/lib/bidirectional-sync";
import { useCivicWallet } from "@/hooks/useCivicWallet";

/**
 * Enhanced wallet authentication hook with cross-app sync
 * Campus Store version - syncs with Main App
 */
export function useWalletAuth() {
  const wallet = useWalletAdapter();
  const civic = useCivicWallet();

  const address = useMemo(() => {
    // Prefer Civic embedded wallet if available, then standard adapter
    return civic.walletAddress || (wallet.connected && wallet.publicKey ? wallet.publicKey.toBase58() : null);
  }, [wallet.connected, wallet.publicKey, civic.walletAddress]);

  const isAuthenticated = wallet.connected || !!civic.user;

  // Handle wallet connection - create session token and sync with main app
  useEffect(() => {
    if ((wallet.connected || civic.user) && address) {
      // Create session token for cross-app authentication
      CrossAppSessionManager.createSessionToken(address, 'campus_store');

      // Sync data with main app
      const syncClient = getSyncClient();
      syncClient.syncOnConnect(address).catch(err => {
        // Silently handle sync errors in production or log to a service
      });
    }
  }, [wallet.connected, civic.user, address]);

  // Handle wallet disconnection - clear session
  useEffect(() => {
    if (!wallet.connected && !civic.user) {
      CrossAppSessionManager.clearSession();
    }
  }, [wallet.connected, civic.user]);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = CrossAppSessionManager.getCurrentSession();
    if (existingSession && !wallet.connected) {
      // Auto-connect will be handled by WalletProvider if wallet is available
    }
  }, []);

  return {
    wallet, // Return full wallet object for compatibility
    address,
    isAuthenticated,
    connected: wallet.connected,
    connecting: wallet.connecting,
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signMessage: wallet.signMessage,
    connect: wallet.connect,
    disconnect: wallet.disconnect,

    // Session helpers
    hasActiveSession: () => CrossAppSessionManager.hasActiveSession(),
  };
}
