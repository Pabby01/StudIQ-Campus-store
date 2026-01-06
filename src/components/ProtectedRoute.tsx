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
            <div className="min-h-screen flex items-center justify-center bg-soft-gray-bg">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
                    <p className="text-muted-text">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show sign in prompt
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-soft-gray-bg">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-3">Sign In Required</h2>
                    <p className="text-muted-text mb-6">Please sign in to access this page</p>
                    <Button variant="primary" onClick={() => router.push("/")}>
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    // Authenticated - render children
    return <>{children}</>;
}
