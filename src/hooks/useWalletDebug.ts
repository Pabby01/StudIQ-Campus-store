"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

interface ConnectionLog {
    timestamp: string;
    step: string;
    status: "info" | "success" | "error" | "warning";
    details?: any;
}

export function useWalletDebug() {
    const wallet = useWallet();
    const [logs, setLogs] = useState<ConnectionLog[]>([]);
    const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);

    const addLog = useCallback((step: string, status: ConnectionLog["status"], details?: any) => {
        const log: ConnectionLog = {
            timestamp: new Date().toISOString(),
            step,
            status,
            details,
        };

        console.log(`[WALLET DEBUG] ${status.toUpperCase()}: ${step}`, details || "");
        setLogs((prev) => [...prev, log]);
    }, []);

    // Monitor wallet state changes
    useEffect(() => {
        addLog("Wallet State Changed", "info", {
            connected: wallet.connected,
            connecting: wallet.connecting,
            disconnecting: wallet.disconnecting,
            publicKey: wallet.publicKey?.toBase58(),
            walletName: wallet.wallet?.adapter.name,
        });
    }, [wallet.connected, wallet.connecting, wallet.disconnecting, wallet.publicKey, addLog]);

    // Monitor for connection attempts
    useEffect(() => {
        if (wallet.connecting) {
            addLog("Connection Attempt Started", "info", {
                walletName: wallet.wallet?.adapter.name,
                readyState: wallet.wallet?.adapter.readyState,
            });

            // Set 30-second timeout
            const timeout = setTimeout(() => {
                addLog("Connection Timeout", "error", {
                    duration: "30s",
                    walletName: wallet.wallet?.adapter.name,
                    suggestion: "Wallet app may not have opened or user didn't approve",
                });
            }, 30000);

            setConnectionTimeout(timeout);
        } else {
            // Clear timeout if connection completes
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                setConnectionTimeout(null);
            }
        }

        return () => {
            if (connectionTimeout) clearTimeout(connectionTimeout);
        };
    }, [wallet.connecting]);

    // Monitor for errors
    useEffect(() => {
        const handleError = (error: any) => {
            addLog("Wallet Error", "error", {
                message: error.message,
                code: error.code,
                name: error.name,
                stack: error.stack?.split('\n')[0],
            });
        };

        if (wallet.wallet?.adapter) {
            wallet.wallet.adapter.on("error", handleError);
            return () => {
                wallet.wallet?.adapter.removeListener("error", handleError);
            };
        }
    }, [wallet.wallet?.adapter, addLog]);

    const exportLogs = useCallback(() => {
        const logsText = logs
            .map((log) => `[${log.timestamp}] ${log.status.toUpperCase()}: ${log.step}\n${JSON.stringify(log.details, null, 2)}`)
            .join("\n\n");

        const blob = new Blob([logsText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wallet-debug-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logs]);

    const clearLogs = useCallback(() => {
        setLogs([]);
        addLog("Logs Cleared", "info");
    }, [addLog]);

    return {
        logs,
        exportLogs,
        clearLogs,
        addLog,
    };
}
