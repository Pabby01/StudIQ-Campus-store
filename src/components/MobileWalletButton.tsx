"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { isMobileDevice } from "@/lib/mobileWallet";
import { useEffect } from "react";

/**
 * Mobile-aware wallet button that uses standard Solana Wallet Adapter UI
 * which properly handles deep linking to native wallet apps
 */
export default function MobileWalletButton() {
    const { wallet, connected, connecting, publicKey } = useWallet();
    const isMobile = isMobileDevice();

    useEffect(() => {
        if (connecting && isMobile && wallet?.adapter.name === 'Mobile Wallet Adapter') {
            console.log('[MobileWalletButton] Mobile Wallet Adapter connecting...');
            console.log('[MobileWalletButton] This should trigger deep link to wallet app');
        }

        if (connected && publicKey) {
            console.log('[MobileWalletButton] Connected with address:', publicKey.toString());
        }
    }, [connecting, connected, isMobile, wallet, publicKey]);

    if (!isMobile) {
        // On desktop, don't render - use custom modal instead
        return null;
    }

    // On mobile, use the standard WalletMultiButton which handles deep links properly
    return (
        <WalletMultiButton
            className="!bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !px-4 !py-2.5 !rounded-lg !font-semibold !text-sm hover:!from-blue-600 hover:!to-blue-700 !transition-all !shadow-md hover:!shadow-lg"
        />
    );
}
