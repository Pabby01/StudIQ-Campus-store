"use client";

import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import WalletCard from "@/components/wallet/WalletCard";
import SendModal from "@/components/wallet/SendModal";
import ReceiveModal from "@/components/wallet/ReceiveModal";
import SwapModal from "@/components/wallet/SwapModal";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { Loader2, Rocket } from "lucide-react";
import TokenList from "@/components/wallet/TokenList";
import { Cluster } from "@/hooks/useSolanaBalance";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

export default function WalletPage() {
    const { walletAddress, isAuthenticated } = useCivicWallet();
    const [cluster, setCluster] = useState<Cluster>('devnet');

    // Updated to use Multi-Token Hook
    const { tokens, totalUsd, loading: balanceLoading } = useTokenBalances(walletAddress, cluster);

    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState("");

    // If loading user or not authenticated
    if (!walletAddress) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">My Wallet</h1>
                <p className="text-muted-text">Manage your funds and view portfolio</p>
            </div>

            <WalletCard
                tokens={tokens}
                totalUsd={totalUsd}
                address={walletAddress}
                loading={balanceLoading}
                cluster={cluster}
                onClusterChange={setCluster}
                onSend={() => setIsSendOpen(true)}
                onReceive={() => setIsReceiveOpen(true)}
                onDeposit={() => {
                    setComingSoonFeature("Deposit");
                    setIsComingSoonOpen(true);
                }}
                onSwap={() => {
                    setComingSoonFeature("Swap");
                    setIsComingSoonOpen(true);
                }}
            />

            <TokenList tokens={tokens} loading={balanceLoading} />

            <TransactionHistory address={walletAddress} cluster={cluster} />

            <SendModal
                isOpen={isSendOpen}
                onClose={() => setIsSendOpen(false)}
                onSuccess={() => {
                    // Refresh logic is auto via hooks poller
                }}
                cluster={cluster}
            />

            <ReceiveModal
                isOpen={isReceiveOpen}
                onClose={() => setIsReceiveOpen(false)}
            />

            <SwapModal
                isOpen={false} // Disabled for now
                onClose={() => { }}
                onSuccess={() => { }}
                cluster={cluster}
            />

            {/* Coming Soon Popup */}
            <Dialog
                isOpen={isComingSoonOpen}
                onClose={() => setIsComingSoonOpen(false)}
                title="Coming Soon! 🚀"
                footer={
                    <Button variant="primary" onClick={() => setIsComingSoonOpen(false)}>
                        Got it!
                    </Button>
                }
            >
                <div className="text-center py-4">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Rocket className="w-8 h-8 text-primary-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {comingSoonFeature} Feature Under Construction
                    </h3>
                    <p className="text-gray-600">
                        We&apos;re working hard to bring {comingSoonFeature.toLowerCase()} functionality to the StudIQ Campus Store. This feature will be available in the next update!
                    </p>
                </div>
            </Dialog>
        </div>
    );
}
