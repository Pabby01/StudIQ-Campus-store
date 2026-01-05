"use client";

import { useUser, SignInButton, UserButton } from "@civic/auth/react";
import { Loader2 } from "lucide-react";

export default function CivicAuthButton() {
    const userContext = useUser();

    // Loading state
    if (userContext.isLoading) {
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

    // Authenticated - show Civic's UserButton
    if (userContext.user) {
        return (
            <div className="civic-user-button">
                <UserButton />
            </div>
        );
    }

    // Not authenticated - use Civic's SignInButton
    // With displayMode="iframe" in provider, this should open as popup overlay
    return <SignInButton />;
}
