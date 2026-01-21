"use client";

import { X } from "lucide-react";
import CivicAuthButton from "./CivicAuthButton";
import Dialog from "./ui/Dialog";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Sign in to Checkout"
        >
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                <div className="bg-blue-50 p-4 rounded-full">
                    <img
                        src="https://cryptologos.cc/logos/solana-sol-logo.png"
                        alt="Security"
                        className="w-12 h-12 opacity-80"
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Join StudIQ Campus Store
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">
                        Create an account or sign in to complete your purchase, track orders, and earn rewards.
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center gap-4">
                        <CivicAuthButton />
                        <p className="text-xs text-gray-400">
                            Secure authentication powered by Civic
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                >
                    Continue as Guest (if supported) or Cancel
                </button>
            </div>
        </Dialog>
    );
}
