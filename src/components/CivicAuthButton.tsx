 
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
    
    // Authenticated - return null (handled by custom UI)
    if (user) {
        return null;
    }

    // Modal Content
    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/20">
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700 shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-8 min-h-[450px] flex flex-col items-center justify-center bg-white relative">
                    {/* Header with Logo */}
                    <div className="mb-6 text-center">
                         <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/20">
                            <span className="text-white font-bold text-2xl">SQ</span>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900">Welcome Back</h3>
                        <p className="text-slate-500 text-sm mt-1">Sign in to access your campus store</p>
                    </div>

                    {CivicAuthIframeContainer ? (
                        <div className="w-full flex-1 flex items-center justify-center civic-embed-container">
                            <style jsx global>{`
                                .civic-embed-container iframe {
                                    border-radius: 24px !important;
                                    overflow: hidden !important;
                                    width: 100% !important;
                                    box-shadow: none !important;
                                }
                            `}</style>
                            {/* @ts-ignore - Component usage */}
                            <CivicAuthIframeContainer />
                        </div>
                    ) : (
                        <div className="text-center space-y-4 w-full">
                            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-2xl text-sm border border-yellow-100">
                                Embedded login requires a newer version of Civic Auth.
                            </div>
                            <div className="flex justify-center w-full">
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
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>{isLoading ? "Loading..." : "Sign In"}</span>
            </button>
            
            {showModal && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
        </>
    );
}
