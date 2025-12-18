"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ExternalLink, Smartphone, Wallet, Check } from "lucide-react";
import { isMobileDevice, isIOS } from "@/lib/mobileWallet";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { wallets, select, connect, connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const isMobile = isMobileDevice();

    const handleConnect = async (walletName: string) => {
        try {
            // Select the wallet
            const wallet = wallets.find(w => w.adapter.name === walletName);
            if (!wallet) return;

            select(wallet.adapter.name);

            // Wait for selection to complete before connecting
            await new Promise(resolve => setTimeout(resolve, 100));

            // Connect
            await connect();

            // Check if profile exists and is complete
            if (publicKey) {
                const address = publicKey.toString();
                console.log("[WalletModal] Checking profile for:", address);

                try {
                    const profileRes = await fetch(`/api/profile/get?address=${address}`, {
                        cache: "no-store",
                        headers: { "Cache-Control": "no-cache" }
                    });

                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        console.log("[WalletModal] Profile found:", profile);

                        // Check if profile is incomplete
                        if (!profile || !profile.name || !profile.school || !profile.campus) {
                            console.log("[WalletModal] Incomplete profile, redirecting to onboarding");
                            onClose();
                            window.location.href = "/onboarding";
                            return;
                        }
                    } else {
                        // Profile doesn't exist
                        console.log("[WalletModal] Profile not found, redirecting to onboarding");
                        onClose();
                        window.location.href = "/onboarding";
                        return;
                    }
                } catch (error) {
                    console.error("[WalletModal] Profile check failed:", error);
                    // On error, redirect to onboarding to be safe
                    onClose();
                    window.location.href = "/onboarding";
                    return;
                }
            }

            onClose();
        } catch (error) {
            console.error("Connection failed:", error);
        }
    };

    if (!isOpen) return null;

    // Available wallets
    const installedWallets = wallets.filter(w => w.readyState === 'Installed');
    const notInstalledWallets = wallets.filter(w => w.readyState === 'NotDetected');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black">
                        {isMobile ? "Connect Mobile Wallet" : "Connect Wallet"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-text hover:text-black transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                {isMobile && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-blue-900 mb-1">Mobile Wallet Connection</p>
                                <p className="text-blue-700">
                                    For the best experience, open this site in your wallet app's built-in browser.
                                    Or select your wallet below to connect.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Installed Wallets */}
                {installedWallets.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-muted-text uppercase mb-3">
                            {isMobile ? "Available Wallets" : "Detected Wallets"}
                        </p>
                        <div className="space-y-2">
                            {installedWallets.map((wallet) => (
                                <Button
                                    key={wallet.adapter.name}
                                    variant="outline"
                                    className="w-full justify-between text-left"
                                    onClick={() => handleConnect(wallet.adapter.name)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={wallet.adapter.icon}
                                            alt={wallet.adapter.name}
                                            className="w-8 h-8"
                                        />
                                        <div>
                                            <div className="font-semibold text-black">{wallet.adapter.name}</div>
                                            {isMobile && (
                                                <div className="text-xs text-muted-text">
                                                    Tap to connect
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {wallet.readyState === 'Installed' && (
                                        <Check className="w-5 h-5 text-green-600" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Not Installed Wallets */}
                {notInstalledWallets.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-muted-text uppercase mb-3">
                            {installedWallets.length > 0 ? "More Wallets" : "Install a Wallet"}
                        </p>
                        <div className="space-y-2">
                            {notInstalledWallets.map((wallet) => (
                                <div
                                    key={wallet.adapter.name}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={wallet.adapter.icon}
                                            alt={wallet.adapter.name}
                                            className="w-8 h-8"
                                        />
                                        <div>
                                            <div className="font-semibold text-black">{wallet.adapter.name}</div>
                                            <div className="text-xs text-muted-text">Not installed</div>
                                        </div>
                                    </div>
                                    <a
                                        href={wallet.adapter.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-blue hover:text-accent-blue text-sm font-medium flex items-center gap-1"
                                    >
                                        Install
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Wallets Available */}
                {wallets.length === 0 && (
                    <div className="text-center py-8">
                        <Wallet className="w-16 h-16 text-muted-text mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">No Wallets Found</h3>
                        <p className="text-muted-text mb-6">
                            Install a Solana wallet to get started
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
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-center text-muted-text">
                        {isMobile
                            ? "Tip: Open this site in your wallet app's browser for seamless connection"
                            : "By connecting, you agree to our Terms of Service"}
                    </p>
                </div>
            </Card>
        </div>
    );
}
