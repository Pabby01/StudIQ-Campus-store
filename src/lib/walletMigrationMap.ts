/**
 * Wallet Import Update Script
 * 
 * This file documents all files that need wallet import updates from:
 * `import { useWallet } from "@solana/react-hooks"`
 * TO:
 * `import { useWallet } from "@solana/wallet-adapter-react"`
 * 
 * OR use the useWalletAuth hook for simpler access
 */

// Files already updated:
// ✅ src/app/providers.tsx
// ✅ src/components/WalletModal.tsx
// ✅ src/hooks/useWalletAuth.ts

// Files that need manual updates:

export const filesToUpdate = [
    // Components
    {
        path: "src/components/WalletBar.tsx",
        changes: [
            "Replace: import { useConnectWallet, useDisconnectWallet, useWallet } from '@solana/react-hooks'",
            "With: import { useWallet } from '@solana/wallet-adapter-react'",
            "Update: wallet.status === 'connected' → wallet.connected",
            "Update: wallet.session.account.address → wallet.publicKey?.toBase58()"
        ]
    },
    {
        path: "src/components/Navbar.tsx",
        changes: [
            "Replace: import { useWallet, useDisconnectWallet } from '@solana/react-hooks'",
            "With: import { useWallet } from '@solana/wallet-adapter-react'",
            "Update wallet state checks"
        ]
    },
    {
        path: "src/components/StoreForm.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/components/ProductReviews.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/components/ProductForm.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/components/ImageUpload.tsx",
        changes: ["Update useWallet import and usage"]
    },

    // Pages
    {
        path: "src/app/pricing/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/pricing/checkout/page.tsx",
        changes: ["Update useWallet import and usage + transaction signing"]
    },
    {
        path: "src/app/onboarding/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/leaderboard/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/wishlist/page.tsx",
        changes: ["Uses useWalletAuth - should work"]
    },
    {
        path: "src/app/dashboard/products/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/products/edit/[id]/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/settings/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/store/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/store/[id]/products/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/store/orders/page.tsx",
        changes: ["Uses useWalletAuth - should work"]
    },
    {
        path: "src/app/dashboard/store/[id]/products/new/page.tsx",
        changes: ["Update useWallet import and usage"]
    },
    {
        path: "src/app/dashboard/orders/page.tsx",
        changes: ["Uses useWalletAuth - should work"]
    },
    {
        path: "src/app/cart/page.tsx",
        changes: ["Update useWallet import and transaction signing"]
    }
];

// Common patterns to replace:

export const replacementPatterns = {
    imports: {
        old: `import { useWallet } from "@solana/react-hooks"`,
        new: `import { useWallet } from "@solana/wallet-adapter-react"`
    },
    walletStatus: {
        old: `wallet.status === "connected"`,
        new: `wallet.connected`
    },
    walletAddress: {
        old: `wallet.session.account.address`,
        new: `wallet.publicKey?.toBase58()`
    },
    walletAddressToString: {
        old: `wallet.session.account.address.toString()`,
        new: `wallet.publicKey?.toBase58()`
    },
    signTransaction: {
        old: `wallet.session.signTransaction`,
        new: `wallet.signTransaction`
    }
};
