import { initializeSDK, Environment } from 'paj_ramp';

const pajApiKey = process.env.PAJ_BUSINESS_API_KEY || "";
const isProduction = process.env.PAJ_ENVIRONMENT === 'production';

// Initialize SDK once
if (typeof window === 'undefined') {
    initializeSDK(isProduction ? Environment.Production : Environment.Staging);
}

export const PAJ_CONFIG = {
    apiKey: pajApiKey,
    webhookUrl: process.env.PAJ_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/ramp/webhook`,
};
