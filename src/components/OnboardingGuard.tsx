"use client";

import { useEffect } from "react";
import { useUser } from "@civic/auth-web3/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Component that ensures new users are redirected to onboarding
 * Place this inside your layout to automatically handle redirects
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip if loading or no user
        if (isLoading || !user) return;

        // Skip if already on onboarding page
        if (pathname === "/onboarding") return;

        // Get email from user
        const userEmail = 'email' in user ? user.email : null;
        if (!userEmail) return;

        // Check if profile exists
        const checkProfile = async () => {
            try {
                console.log("[OnboardingGuard] Checking profile for:", userEmail);
                const res = await fetch(`/api/profile/check?email=${encodeURIComponent(userEmail as string)}`);
                const data = await res.json();

                console.log("[OnboardingGuard] Profile check result:", data);

                if (!data.exists) {
                    console.log("[OnboardingGuard] New user detected, redirecting to onboarding");
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("[OnboardingGuard] Profile check failed:", error);
            }
        };

        // Small delay to ensure user data is fully loaded
        const timeout = setTimeout(checkProfile, 500);
        return () => clearTimeout(timeout);
    }, [user, isLoading, pathname, router]);

    return <>{children}</>;
}
