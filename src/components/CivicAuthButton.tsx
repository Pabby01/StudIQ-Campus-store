/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useUser, UserButton } from "@civic/auth-web3/react";

export default function CivicAuthButton() {
    const { user } = useUser();
    
    // Authenticated - return null (handled by custom UI)
    if (user) {
        return null;
    }

    return (
        <div className="flex justify-center w-full">
            <UserButton />
        </div>
    );
}
