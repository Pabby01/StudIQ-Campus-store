"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppModal() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            // Check if running as standalone app
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');

            setIsInstalled(isStandalone);

            // Don't show modal  if already installed
            if (isStandalone) {
                setShowModal(false);
            }
        };

        checkInstalled();

        // Listen for beforeinstallprompt event
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Save the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show custom install modal
            setShowModal(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for app installed event
        const installedHandler = () => {
            setShowModal(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the browser's install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowModal(false);
    };

    const handleDismiss = () => {
        setShowModal(false);
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    // Don't render if already installed or no prompt available
    if (isInstalled || !showModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/20 rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Logo/Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Install StudIQ Campus Store
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Get instant access to campus deals. Add to your home screen for a faster, app-like experience with offline access.
                    </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-gray-300">Lightning-fast loading</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <span className="text-gray-300">Push notifications for new deals</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-gray-300">Works like a native app</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleInstallClick}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        Install Now
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-full py-2 px-6 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
