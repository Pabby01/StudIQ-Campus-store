/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useUser } from "@civic/auth-web3/react";
import { Loader2, LogIn } from "lucide-react";

export default function CivicAuthButton() {
    const { user, isLoading, signIn } = useUser();
    
    // Authenticated - return null (handled by custom UI)
    if (user) {
        return null;
    }

    return (
        <button
            onClick={() => signIn("redirect")}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{isLoading ? "Loading..." : "Sign In with Civic"}</span>
        </button>
    );
}
