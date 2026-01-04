"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/**
 * Wallet button that works on both desktop and mobile
 * Phantom and Solflare adapters handle mobile web automatically
 */
export default function MobileWalletButton() {
    return (
        <WalletMultiButton
            className="!bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !px-4 !py-2.5 !rounded-lg !font-semibold !text-sm hover:!from-blue-600 hover:!to-blue-700 !transition-all !shadow-md hover:!shadow-lg"
        />
    );
}
