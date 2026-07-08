"use client";

import { X } from "lucide-react";
import Dialog from "./ui/Dialog";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Join StudIQ Campus Store"
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
                        Sign in to Checkout
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">
                        Create an account or sign in to complete your purchase, track orders, and earn rewards.
                    </p>
                </div>

                <div className="w-full max-w-sm space-y-3">
                    <Button 
                        onClick={() => { onClose(); router.push('/auth'); }}
                        className="w-full flex justify-center py-3"
                    >
                        Log In
                    </Button>
                    <button 
                        onClick={() => { onClose(); router.push('/auth'); }}
                        className="w-full flex justify-center py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Create an Account
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                >
                    Continue as Guest or Cancel
                </button>
            </div>
        </Dialog>
    );
}
