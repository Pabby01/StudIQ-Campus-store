"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useWalletConnection, useConnectWallet } from "@solana/react-hooks";
import { ExternalLink, Smartphone, Wallet } from "lucide-react";
import { isMobileDevice, isIOS } from "@/lib/mobileWallet";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { connectors } = useWalletConnection();
    const connectWallet = useConnectWallet();

    const handleConnect = async (connectorId: string) => {
        try {
            await connectWallet(connectorId);
            onClose();
        } catch (error) {
            console.error("Connection failed:", error);
        }
    };

    if (!isOpen) return null;

    const isMobile = isMobileDevice();
    const hasWallets = connectors && connectors.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black">
                        {isMobile ? "Connect Mobile Wallet" : "Connect Wallet"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-text hover:text-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {isMobile && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-blue-900 mb-1">Mobile Wallet Detected</p>
                                <p className="text-blue-700">
                                    Tap a wallet below to open the app. If you don't have a wallet installed,
                                    we'll redirect you to download it.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!hasWallets ? (
                    <div className="text-center py-8">
                        <Wallet className="w-16 h-16 text-muted-text mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">No Wallets Found</h3>
                        <p className="text-muted-text mb-6">
                            {isMobile
                                ? "Install a Solana wallet app to get started"
                                : "Install a Solana wallet extension to get started"}
                        </p>

                        <div className="space-y-3">
                            <a
                                href={isIOS()
                                    ? "https://apps.apple.com/app/phantom-crypto-wallet/id1598432977"
                                    : isMobile
                                        ? "https://play.google.com/store/apps/details?id=app.phantom"
                                        : "https://phantom.app/download"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <span>Get Phantom Wallet</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>

                            <a
                                href={isIOS()
                                    ? "https://apps.apple.com/app/solflare/id1580902717"
                                    : isMobile
                                        ? "https://play.google.com/store/apps/details?id=com.solflare.mobile"
                                        : "https://solflare.com/download"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <span>Get Solflare Wallet</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connectors.map((connector) => (
                            <Button
                                key={connector.id}
                                variant="outline"
                                className="w-full justify-between text-left"
                                onClick={() => handleConnect(connector.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {connector.icon && (
                                        <img
                                            src={connector.icon}
                                            alt={connector.name}
                                            className="w-8 h-8"
                                        />
                                    )}
                                    <div>
                                        <div className="font-semibold text-black">{connector.name}</div>
                                        {isMobile && (
                                            <div className="text-xs text-muted-text">
                                                Tap to open app
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isMobile && <Smartphone className="w-5 h-5 text-muted-text" />}
                            </Button>
                        ))}
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-center text-muted-text">
                        {isMobile
                            ? "Make sure you have the wallet app installed on your device"
                            : "By connecting, you agree to our Terms of Service"}
                    </p>
                </div>
            </Card>
        </div>
    );
}
