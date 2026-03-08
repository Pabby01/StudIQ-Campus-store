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
            <div className="min-h-screen flex items-center justify-center p-4 bg-soft-gray-bg mesh-bg">
                <div className="glass-panel rounded-3xl p-8 md:p-12 w-full max-w-md text-center border border-white/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        
                        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Please sign in to access your dashboard and manage your store.
                        </p>
                        
                        <div className="space-y-4">
                            <Button 
                                variant="primary" 
                                onClick={() => router.push("/")}
                                className="w-full py-6 text-lg rounded-xl shadow-lg shadow-primary-blue/20 hover:shadow-primary-blue/40 transition-all duration-300"
                            >
                                Go to Home
                            </Button>
                            
                            <p className="text-xs text-slate-400 mt-6">
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
