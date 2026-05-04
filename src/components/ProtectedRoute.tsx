/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useUser } from "@civic/auth-web3/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireWallet?: boolean;
}

/**
 * Protected Route wrapper for dashboard pages
 * Ensures user is authenticated via Civic Auth before rendering children
 */
export function ProtectedRoute({ children, requireWallet = false }: ProtectedRouteProps) {
    const { user, isLoading } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading while checking auth
    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-soft-gray-bg mesh-bg px-4">
                <div className="glass-panel rounded-3xl p-8 w-full max-w-sm text-center">
                    <div className="mx-auto h-12 w-12 rounded-full border-2 border-primary-blue/30 border-t-primary-blue animate-spin" />
                    <p className="text-sm text-muted-text mt-4">Loading your dashboard...</p>
                    <div className="mt-6 space-y-3">
                        <div className="h-3 w-32 mx-auto rounded-full bg-white/80" />
                        <div className="h-3 w-24 mx-auto rounded-full bg-white/70" />
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated - show sign in prompt
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
                </div>
                <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-white/95 p-8 md:p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/25">
                        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-700">
                            Secure access
                        </span>
                        
                        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Sign in required</h2>
                        <p className="mt-3 text-slate-600 leading-relaxed">
                            Please sign in to access your dashboard and manage your store.
                        </p>
                        
                        <div className="mt-8 space-y-3">
                            <Button 
                                variant="primary" 
                                onClick={() => router.push("/auth")}
                                className="w-full py-6 text-lg rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300"
                            >
                                Sign In
                            </Button>
                            
                            <p className="text-xs text-slate-400 mt-5">
                                Protected by StudIQ Secure Auth
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated - render children
    return <>{children}</>;
}
