"use client";

import { useUser, SignInButton, UserButton } from "@civic/auth-web3/react";
import { Loader2 } from "lucide-react";

export default function CivicAuthButton() {
    const { user, isLoading, authStatus } = useUser();

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

    // Authenticated - show Civic's UserButton
    if (user) {
        return (
            <div className="civic-user-button">
                <UserButton />
            </div>
        );
    }

    // Not authenticated - use Civic's SignInButton with custom UI wrapper
    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative bg-black rounded-xl p-[1px]">
                <SignInButton />
            </div>
        </div>
    );
}
