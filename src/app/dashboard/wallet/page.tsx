"use client";

import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useSolanaBalance } from "@/hooks/useSolanaBalance";
import WalletCard from "@/components/wallet/WalletCard";
import SendModal from "@/components/wallet/SendModal";
import ReceiveModal from "@/components/wallet/ReceiveModal";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { Loader2 } from "lucide-react";

import { Cluster } from "@/hooks/useSolanaBalance";

export default function WalletPage() {
    const { walletAddress, isAuthenticated } = useCivicWallet();
    const [cluster, setCluster] = useState<Cluster>('devnet');
    const { balance, loading: balanceLoading } = useSolanaBalance(walletAddress, cluster);

    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

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
                <p className="text-muted-text">Manage your funds and view transactions</p>
            </div>

            <WalletCard
                balance={balance}
                address={walletAddress}
                loading={balanceLoading}
                cluster={cluster}
                onClusterChange={setCluster}
                onSend={() => setIsSendOpen(true)}
                onReceive={() => setIsReceiveOpen(true)}
                onDeposit={() => alert("Coming Soon!")}
            />

            <TransactionHistory address={walletAddress} cluster={cluster} />

            <SendModal
                isOpen={isSendOpen}
                onClose={() => setIsSendOpen(false)}
                onSuccess={() => {
                    // Refresh logic handled by hooks automatically (polling)
                    // But could trigger a re-fetch manually if hooks exposed it
                }}
                cluster={cluster}
            />

            <ReceiveModal
                isOpen={isReceiveOpen}
                onClose={() => setIsReceiveOpen(false)}
            />
        </div>
    );
}
