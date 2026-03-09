 
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useUser, SignInButton } from "@civic/auth-web3/react";
// @ts-ignore - Import might not be typed in all versions
import { CivicAuthIframeContainer } from "@civic/auth-web3/react";
import { Loader2, X, LogIn } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function CivicAuthButton() {
    const { user, isLoading, authStatus } = useUser();
    const [showModal, setShowModal] = useState(false);

    // Loading state
    if (isLoading || authStatus === "authenticating") {
        return (
            <button
                disabled
                className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-60"
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
            </button>
        );
    }

    // Authenticated - return null (handled by custom UI)
    if (user) {
        return null;
    }

    // Modal Content
    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Sign In to StudIQ</h3>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 min-h-[400px] flex flex-col items-center justify-center bg-white">
                    {CivicAuthIframeContainer ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {/* @ts-ignore - Component usage */}
                            <CivicAuthIframeContainer />
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                                Embedded login requires a newer version of Civic Auth.
                            </div>
                            <div className="flex justify-center">
                                <SignInButton />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Not authenticated - Custom Button that opens Modal
    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
            </button>
            
            {showModal && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
        </>
    );
}
