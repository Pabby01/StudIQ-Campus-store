"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Wallet } from "lucide-react";

export default function CustomWalletButton() {
    const { wallet, wallets, select, connect, disconnect, connected, publicKey, connecting } = useWallet();
    const [showMenu, setShowMenu] = useState(false);

    // FILTER OUT Mobile Wallet Adapter
    const availableWallets = wallets.filter(
        (w) => w.adapter.name !== "Mobile Wallet Adapter"
    );

    const handleWalletSelect = async (walletName: string) => {
        try {
            select(walletName as any); // Type assertion to bypass WalletName brand
            await new Promise((resolve) => setTimeout(resolve, 100));
            await connect();
            setShowMenu(false);
        } catch (error) {
            console.error("Connection error:", error);
        }
    };

    if (connected && publicKey) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                    </span>
                </button>

                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                            onClick={() => {
                                disconnect();
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
            >
                <Wallet className="w-4 h-4" />
                <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Wallet Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                            Select Wallet
                        </div>

                        {availableWallets.length === 0 ? (
                            <div className="text-sm text-gray-600 p-4 text-center">
                                No wallets detected. Please install Phantom or Solflare.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {availableWallets.map((w) => (
                                    <button
                                        key={w.adapter.name}
                                        onClick={() => handleWalletSelect(w.adapter.name)}
                                        disabled={w.readyState !== "Installed"}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                                    >
                                        <img
                                            src={w.adapter.icon}
                                            alt={w.adapter.name}
                                            className="w-6 h-6"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {w.adapter.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {w.readyState === "Installed"
                                                    ? "Detected"
                                                    : "Not Installed"}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                Don't have a wallet?{" "}
                                <a
                                    href="https://phantom.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-blue hover:underline"
                                >
                                    Get Phantom
                                </a>
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
