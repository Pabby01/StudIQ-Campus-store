import { useWallet as useWalletAdapter } from "@solana/wallet-adapter-react";
import { useMemo, useEffect } from "react";
import { CrossAppSessionManager } from "@/lib/cross-app-session";
import { getSyncClient } from "@/lib/bidirectional-sync";

/**
 * Enhanced wallet authentication hook with cross-app sync
 * Campus Store version - syncs with Main App
 */
export function useWalletAuth() {
  const wallet = useWalletAdapter();

  const address = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) return null;
    return wallet.publicKey.toBase58();
  }, [wallet.connected, wallet.publicKey]);

  const isAuthenticated = wallet.connected;

  // Handle wallet connection - create session token and sync with main app
  useEffect(() => {
    if (wallet.connected && address) {
      // Create session token for cross-app authentication
      CrossAppSessionManager.createSessionToken(address, 'campus_store');

      // Sync data with main app
      const syncClient = getSyncClient();
      syncClient.syncOnConnect(address).catch(err => {
        console.error('Sync error on connect:', err);
      });

      console.log('✅ Wallet connected on store, session created, sync initiated:', address);
    }
  }, [wallet.connected, address]);

  // Handle wallet disconnection - clear session
  useEffect(() => {
    if (!wallet.connected) {
      CrossAppSessionManager.clearSession();
      console.log('✅ Session cleared on disconnect');
    }
  }, [wallet.connected]);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = CrossAppSessionManager.getCurrentSession();
    if (existingSession && !wallet.connected) {
      console.log('📱 Found existing session from main app, attempting auto-connect...');
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
