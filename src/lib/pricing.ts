// Utility for converting USD to SOL and handling pricing

const SOL_PRICE_USD = 100; // Approximate SOL price in USD - should be fetched from an API in production

export function convertUSDtoSOL(usdAmount: number): number {
    return parseFloat((usdAmount / SOL_PRICE_USD).toFixed(4));
}

export function convertSOLtoUSD(solAmount: number): number {
    return parseFloat((solAmount * SOL_PRICE_USD).toFixed(2));
}

export function formatSOL(amount: number): string {
    return `${amount.toFixed(4)} SOL`;
}

export function formatUSD(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

// Pricing tiers with both monthly and yearly options
export const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free',
        monthly: 0,
        yearly: 0,
        maxStores: 1,
        platformFee: 5
    },
    premium: {
        name: 'Premium',
        monthly: 14.99,
        yearly: 149.99, // 2 months free (16% discount)
        maxStores: 5,
        platformFee: 2
    },
    enterprise: {
        name: 'Enterprise',
        monthly: 49.99,
        yearly: 499.99, // 2 months free (16% discount)
        maxStores: 20,
        platformFee: 0
    }
};

export type BillingCycle = 'monthly' | 'yearly';
export type PlanName = 'free' | 'premium' | 'enterprise';

export function getPlanPrice(plan: PlanName, cycle: BillingCycle): number {
    return SUBSCRIPTION_PLANS[plan][cycle];
}

export function getPlanPriceInSOL(plan: PlanName, cycle: BillingCycle): number {
    const usdPrice = getPlanPrice(plan, cycle);
    return convertUSDtoSOL(usdPrice);
}

export function calculateYearlySavings(plan: PlanName): number {
    const monthly = SUBSCRIPTION_PLANS[plan].monthly;
    const yearly = SUBSCRIPTION_PLANS[plan].yearly;
    const monthlyAnnual = monthly * 12;
    return monthlyAnnual - yearly;
}

// Platform wallet address for receiving payments
export const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js';
