// Unified currency definitions
// This ensures consistency across product creation, pricing, and filters

export const CURRENCIES = [
    { code: "USDC", symbol: "$", name: "USD Coin" },
    { code: "USDT", symbol: "$", name: "Tether" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "USDC";

// Helper to get currency symbol
export function getCurrencySymbol(code: string): string {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.symbol : code;
}
