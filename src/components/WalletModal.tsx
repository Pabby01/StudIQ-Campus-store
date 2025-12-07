"use client";

import { useState } from "react";
import { X, ExternalLink, CheckCircle } from "lucide-react";
import { useWalletConnection, useConnectWallet } from "@solana/react-hooks";
import Button from "@/components/ui/Button";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { connectors } = useWalletConnection();
    const connect = useConnectWallet();
    const [connecting, setConnecting] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConnect = async (connectorId: string) => {
        setConnecting(connectorId);
        try {
            await connect(connectorId);
            // Redirect to connect page for authentication
            window.location.href = "/connect";
        } catch (error) {
            console.error("Connection failed:", error);
            setConnecting(null);
        }
    };

    // Wallet metadata (icons and info)
    const walletInfo: Record<string, { name: string; icon: string; installUrl: string }> = {
        phantom: {
            name: "Phantom",
            icon: "https://phantom.app/img/phantom-logo.svg",
            installUrl: "https://phantom.app/download",
        },
        solflare: {
            name: "Solflare",
            icon: "https://solflare.com/assets/logo.svg",
            installUrl: "https://solflare.com/download",
        },
        backpack: {
            name: "Backpack",
            icon: "https://www.backpack.app/favicon.ico",
            installUrl: "https://www.backpack.app/downloads",
        },
        coinbase: {
            name: "Coinbase Wallet",
            icon: "https://www.coinbase.com/favicon.ico",
            installUrl: "https://www.coinbase.com/wallet/downloads",
        },
    };

    // Detect installed wallets
    const installedWallets = connectors.map((c) => c.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-gray">
                    <h2 className="text-2xl font-bold text-black">Connect Wallet</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-soft-gray-bg rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-text" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-88px)]">
                    <p className="text-sm text-muted-text mb-4">
                        Choose your preferred Solana wallet to connect
                    </p>

                    {/* Installed Wallets */}
                    {connectors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-text uppercase mb-2">
                                Detected Wallets
                            </p>
                            {connectors.map((connector) => {
                                const info = walletInfo[connector.id.toLowerCase()] || {
                                    name: connector.id,
                                    icon: "",
                                    installUrl: "",
                                };

                                return (
                                    <button
                                        key={connector.id}
                                        onClick={() => handleConnect(connector.id)}
                                        disabled={connecting !== null}
                                        className="w-full flex items-center gap-4 p-4 bg-soft-gray-bg hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {/* Wallet Icon */}
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {info.icon ? (
                                                <img
                                                    src={info.icon}
                                                    alt={info.name}
                                                    className="w-6 h-6"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-primary-blue rounded" />
                                            )}
                                        </div>

                                        {/* Wallet Name */}
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-black">{info.name}</p>
                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Installed
                                            </p>
                                        </div>

                                        {/* Connecting State */}
                                        {connecting === connector.id && (
                                            <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Not Installed Wallets */}
                    {Object.entries(walletInfo)
                        .filter(([id]) => !installedWallets.includes(id))
                        .map(([id, info]) => (
                            <div
                                key={id}
                                className="w-full flex items-center gap-4 p-4 bg-soft-gray-bg rounded-xl opacity-60"
                            >
                                {/* Wallet Icon */}
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                    {info.icon ? (
                                        <img
                                            src={info.icon}
                                            alt={info.name}
                                            className="w-6 h-6"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-6 h-6 bg-gray-300 rounded" />
                                    )}
                                </div>

                                {/* Wallet Name */}
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-black">{info.name}</p>
                                    <p className="text-xs text-muted-text">Not installed</p>
                                </div>

                                {/* Install Link */}
                                <a
                                    href={info.installUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-blue hover:text-accent-blue text-sm font-medium flex items-center gap-1"
                                >
                                    Install
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}

                    {/* No Wallets Detected */}
                    {connectors.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-text mb-4">
                                No Solana wallets detected in your browser
                            </p>
                            <p className="text-sm text-muted-text mb-6">
                                Install a wallet to get started
                            </p>
                            <div className="space-y-2">
                                {Object.entries(walletInfo).map(([id, info]) => (
                                    <a
                                        key={id}
                                        href={info.installUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <Button variant="outline" className="w-full">
                                            Install {info.name}
                                            <ExternalLink className="w-4 h-4 ml-2" />
                                        </Button>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-gray bg-soft-gray-bg">
                    <p className="text-xs text-muted-text text-center">
                        By connecting your wallet, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
}
