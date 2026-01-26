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
import { Cluster } from "@/hooks/useSolanaBalance";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import TokenList from "@/components/wallet/TokenList";
import RampModal from "@/components/ramp/RampModal";

export default function WalletPage() {
    const { walletAddress, isAuthenticated } = useCivicWallet();
    const [cluster, setCluster] = useState<Cluster>('devnet');

    // Updated to use Multi-Token Hook
    const { tokens, totalUsd, loading: balanceLoading } = useTokenBalances(walletAddress, cluster);

    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isRampOpen, setIsRampOpen] = useState(false);
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
                onDeposit={() => setIsRampOpen(true)}
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

            <RampModal
                isOpen={isRampOpen}
                onClose={() => setIsRampOpen(false)}
            />

            {/* Coming Soon Popup */}
            <Dialog
                isOpen={isComingSoonOpen}
                onClose={() => setIsComingSoonOpen(false)}
                title="Coming Soon! 🚀"
                footer={
                    <Button variant="primary" className="w-full h-12 rounded-xl font-bold" onClick={() => setIsComingSoonOpen(false)}>
                        Got it, I&apos;ll be waiting!
                    </Button>
                }
            >
                <div className="text-center py-6 space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all duration-500"></div>
                        <div className="relative bg-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                            <Rocket className="w-10 h-10 text-primary-blue animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                            {comingSoonFeature} Feature Under Construction
                        </h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            We&apos;re building something amazing! {comingSoonFeature} functionality is currently in development and will be available in the next major update of the StudIQ Campus Store.
                        </p>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">Stay Tuned</p>
                        <p className="text-xs text-blue-900/70 font-bold">Follow our announcements for launch dates!</p>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
