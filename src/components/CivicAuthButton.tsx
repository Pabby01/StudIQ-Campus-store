"use client";

import { useUser } from "@civic/auth-web3/react";
import { UserButton } from "@civic/auth-web3/react";
import { Loader2, LogIn } from "lucide-react";

export default function CivicAuthButton() {
    const { user, isLoading, authStatus, signIn } = useUser();

    // Loading state
    if (isLoading || authStatus === "authenticating") {
        return (
            <button
                disabled
                className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Loading...</span>
            </button>
        );
    }

    // Authenticated - show Civic's UserButton component
    if (user) {
        return (
            <div className="civic-user-button">
                <UserButton />
            </div>
        );
    }

    // Not authenticated - show custom sign in button
    return (
        <button
            onClick={() => signIn()}
            className="px-6 py-2.5 bg-gradient-to-r from-primary-blue to-accent-blue text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center gap-2"
        >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
        </button>
    );
}
