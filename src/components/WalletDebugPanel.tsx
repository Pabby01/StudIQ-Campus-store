"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletDebug } from "@/hooks/useWalletDebug";
import { useEffect, useState } from "react";
import { X, Download, Trash2, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export default function WalletDebugPanel() {
    const wallet = useWallet();
    const { logs, exportLogs, clearLogs, addLog } = useWalletDebug();
    const [isOpen, setIsOpen] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    // Auto-show panel when connecting
    useEffect(() => {
        if (wallet.connecting) {
            setShowPanel(true);
            setIsOpen(true);
        }
    }, [wallet.connecting]);

    // Show panel by pressing Ctrl+Shift+D
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "D") {
                e.preventDefault();
                setShowPanel((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    if (!showPanel) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "error":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "warning":
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-primary-blue text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                    🔍 Debug Panel ({logs.length})
                </button>
            )}

            {/* Debug Panel */}
            {isOpen && (
                <div className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div>
                            <h3 className="font-bold text-lg">Wallet Connection Debug</h3>
                            <p className="text-xs text-gray-500">Press Ctrl+Shift+D to toggle</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Current Status */}
                    <div className="p-4 border-b border-gray-200 bg-blue-50">
                        <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Status:</span>
                                {wallet.connected && <span className="text-green-600 font-bold">✅ Connected</span>}
                                {wallet.connecting && <span className="text-yellow-600 font-bold">⏳ Connecting...</span>}
                                {!wallet.connected && !wallet.connecting && <span className="text-gray-600">❌ Disconnected</span>}
                            </div>
                            {wallet.wallet && (
                                <div className="text-xs text-gray-600">
                                    Wallet: {wallet.wallet.adapter.name}
                                </div>
                            )}
                            {wallet.publicKey && (
                                <div className="text-xs text-gray-600 font-mono">
                                    {wallet.publicKey.toBase58().slice(0, 8)}...{wallet.publicKey.toBase58().slice(-8)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                        {logs.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No logs yet. Try connecting a wallet.</p>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded text-xs border ${log.status === "error"
                                            ? "bg-red-50 border-red-200"
                                            : log.status === "success"
                                                ? "bg-green-50 border-green-200"
                                                : log.status === "warning"
                                                    ? "bg-yellow-50 border-yellow-200"
                                                    : "bg-white border-gray-200"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(log.status)}
                                        <div className="flex-1">
                                            <div className="font-semibold">{log.step}</div>
                                            <div className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            {log.details && (
                                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 p-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={exportLogs}
                            disabled={logs.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-primary-blue text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex-1"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={clearLogs}
                            disabled={logs.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
