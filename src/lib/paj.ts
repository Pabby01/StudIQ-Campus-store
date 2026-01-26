import { initializeSDK, Environment } from 'paj_ramp';

const pajApiKey = process.env.PAJ_BUSINESS_API_KEY || "";
const isProduction = process.env.PAJ_ENVIRONMENT === 'production';

// Initialize SDK once
if (typeof window === 'undefined') {
    if (!pajApiKey) {
        console.warn("⚠️ PAJ_BUSINESS_API_KEY is missing in .env");
    }

    initializeSDK(isProduction ? Environment.Production : Environment.Staging);
    console.log(`[PAJ SDK] Initialized in ${isProduction ? 'Production' : 'Staging'} mode`);
}

export const PAJ_CONFIG = {
    apiKey: pajApiKey,
    webhookUrl: process.env.PAJ_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/ramp/webhook`,
};
