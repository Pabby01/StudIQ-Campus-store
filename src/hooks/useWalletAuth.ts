import { useWallet as useWalletAdapter } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export function useWalletAuth() {
  const wallet = useWalletAdapter();

  const address = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) return null;
    return wallet.publicKey.toBase58();
  }, [wallet.connected, wallet.publicKey]);

  const isAuthenticated = wallet.connected;

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
  };
}
