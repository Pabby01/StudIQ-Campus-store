"use client";

import CivicAuthButton from "@/components/CivicAuthButton";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-gray-bg px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-border-gray p-8 space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Sign in to StudIQ Campus Store
          </h1>
          <p className="text-sm text-muted-text">
            Use your Civic account and wallet to access your dashboard, wallet, and stores.
          </p>
        </div>
        <div className="flex justify-center">
          <CivicAuthButton />
        </div>
      </div>
    </div>
  );
}
