"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            // Notify parent window (if opened in popup)
            if (window.opener) {
                window.opener.postMessage({ type: 'civic-auth-success', code }, window.location.origin);
                window.close();
            } else {
                // If not in popup, redirect to home
                router.push('/');
            }
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-soft-gray-bg">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Completing authentication...</p>
            </div>
        </div>
    );
}
