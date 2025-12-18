/**
 * Mobile Wallet Detection Utility
 * Helps detect and optimize wallet experience for mobile devices
 */

export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android/i.test(navigator.userAgent);
}

/**
 * Get the appropriate wallet deep link based on device
 */
export function getWalletDeepLink(walletName: string, params?: Record<string, string>): string {
    const baseUrls: Record<string, { ios: string; android: string }> = {
        phantom: {
            ios: 'phantom://',
            android: 'https://phantom.app/ul/'
        },
        solflare: {
            ios: 'solflare://',
            android: 'https://solflare.com/ul/'
        }
    };

    const wallet = baseUrls[walletName.toLowerCase()];
    if (!wallet) return '';

    const platform = isIOS() ? 'ios' : 'android';
    const baseUrl = wallet[platform];

    if (params) {
        const queryString = new URLSearchParams(params).toString();
        return `${baseUrl}?${queryString}`;
    }

    return baseUrl;
}

/**
 * Check if a specific wallet app is likely installed
 * Note: This is a best-effort detection and may not be 100% accurate
 */
export async function isWalletInstalled(walletName: string): Promise<boolean> {
    if (!isMobileDevice()) return false;

    // For mobile, we can't reliably detect if an app is installed
    // We just return true to show the option and let the OS handle it
    return true;
}

/**
 * Open wallet app with deep link
 */
export function openWalletApp(walletName: string, fallbackUrl?: string): void {
    if (!isMobileDevice()) return;

    const deepLink = getWalletDeepLink(walletName);

    if (deepLink) {
        // Try to open via deep link
        window.location.href = deepLink;

        // Fallback to app store if deep link fails after 1.5s
        if (fallbackUrl) {
            setTimeout(() => {
                const appStoreUrl = isIOS()
                    ? 'https://apps.apple.com/app/phantom-crypto-wallet/id1598432977'
                    : 'https://play.google.com/store/apps/details?id=app.phantom';

                window.location.href = fallbackUrl || appStoreUrl;
            }, 1500);
        }
    }
}
