import { useState, useEffect } from 'react';

// VAPID Public Key - This should ideally be in env vars, but for PWA we need it public
// You need to generate this. For now I'll use a placeholder or ask user to provide one.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);

            // Register SW
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    return registration.pushManager.getSubscription();
                })
                .then(sub => {
                    setSubscription(sub);
                })
                .catch(err => console.error('SW registration failed', err));
        }
    }, []);

    const subscribe = async (userAddress: string) => {
        if (!isSupported || !VAPID_PUBLIC_KEY) {
            console.error('Push notifications not supported or missing VAPID key');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            setSubscription(sub);

            // Send to server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    userAddress
                })
            });

            return true;
        } catch (err) {
            console.error('Failed to subscribe:', err);
            return false;
        }
    };

    return { isSupported, subscription, subscribe };
}
