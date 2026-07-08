"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useUser } from "@civic/auth-web3/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Component that ensures new users are redirected to onboarding.
 * Establishes a server session first if the cookie is missing, then
 * checks whether the profile exists and is complete.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const userContext = useUser();
    const { user, isLoading } = userContext;
    const router = useRouter();
    const pathname = usePathname();
    const hasChecked = useRef(false);

    // Extract token — poll until it's available since Civic loads it async
    const userAny = user as any;
    const token: string | null = userAny?.idToken || userAny?.token || null;
    const walletAddress: string | null = userAny?.solana?.address || null;

    useEffect(() => {
        // Skip if still loading Civic auth
        if (isLoading || !user) return;

        // Skip auth/onboarding pages and admin to avoid redirect loops
        if (
            pathname === "/onboarding" ||
            pathname === "/signup" ||
            pathname === "/auth" ||
            pathname?.startsWith("/admin")
        ) return;

        // We need a token OR a wallet address — wait until one is available
        if (!token && !walletAddress) return;

        // Prevent running the check more than once per token/address combo
        if (hasChecked.current) return;
        hasChecked.current = true;

        const userEmail: string | null = userAny?.email || null;
        const civicUserId: string | null = userAny?.id || userAny?.sub || null;

        const checkProfile = async () => {
            try {
                // Step 1: Ensure a server session exists.
                const hasCookie =
                    typeof document !== "undefined" &&
                    document.cookie.includes("sid=");

                if (!hasCookie) {
                    const addressToVerify =
                        walletAddress || (civicUserId ? `civic_${civicUserId}` : null);

                    try {
                        const verifyRes = await fetch("/api/auth/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                token,
                                address: addressToVerify,
                            }),
                        });
                        if (!verifyRes.ok) {
                            hasChecked.current = false;
                            return;
                        }
                    } catch {
                        hasChecked.current = false;
                        return;
                    }
                }

                // Step 2: Check if profile exists and is complete.
                const params = new URLSearchParams();
                if (userEmail) params.set("email", userEmail);
                if (walletAddress) params.set("address", walletAddress);
                if (civicUserId) params.set("civicId", civicUserId);

                const headers: HeadersInit = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`/api/profile/check?${params.toString()}`, {
                    headers,
                });

                if (!res.ok) {
                    hasChecked.current = false;
                    return;
                }

                const data = await res.json();

                // Redirect if profile doesn't exist OR is incomplete (missing key fields)
                if (!data.exists || !data.isComplete) {
                    router.push("/onboarding");
                }
            } catch {
                hasChecked.current = false;
            }
        };

        const timeout = setTimeout(checkProfile, 800);
        return () => clearTimeout(timeout);
    // Re-run when token or walletAddress become available (Civic loads them asynchronously)
    }, [user, isLoading, token, walletAddress, pathname, router, userAny]);

    return <>{children}</>;
}


