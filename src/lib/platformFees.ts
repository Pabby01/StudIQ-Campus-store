import { getSupabaseServerClient } from "./supabase";

/**
 * Get platform fee percentage based on seller's subscription plan
 */
export async function getPlatformFee(sellerAddress: string): Promise<number> {
    // We are now using a flat 5% platform fee for all sellers
    return 5.0;
}

/**
 * Calculate platform fee and seller payout
 */
export function calculateFees(orderAmount: number, feePercentage: number) {
    const feeAmount = orderAmount * (feePercentage / 100);
    const sellerPayout = orderAmount - feeAmount;

    return {
        feeAmount: parseFloat(feeAmount.toFixed(4)),
        sellerPayout: parseFloat(sellerPayout.toFixed(4)),
        feePercentage
    };
}

/**
 * Record platform fee in database
 */
export async function recordPlatformFee({
    orderId,
    sellerAddress,
    sellerPlan,
    feePercentage,
    feeAmount,
    feeCurrency,
    orderAmount,
    sellerPayout
}: {
    orderId: string;
    sellerAddress: string;
    sellerPlan: string;
    feePercentage: number;
    feeAmount: number;
    feeCurrency: string;
    orderAmount: number;
    sellerPayout: number;
}) {
    const supabase = getSupabaseServerClient();

    try {
        const { error } = await supabase
            .from("platform_fees")
            .insert({
                order_id: orderId,
                seller_address: sellerAddress,
                seller_plan: sellerPlan,
                fee_percentage: feePercentage,
                fee_amount: feeAmount,
                fee_currency: feeCurrency,
                order_amount: orderAmount,
                seller_payout: sellerPayout
            });

        if (error) {
            console.error("Error recording platform fee:", error);
            throw error;
        }
    const feeAmount = orderAmount * (feePercentage / 100);
    const sellerPayout = orderAmount - feeAmount;

    return {
        feeAmount: parseFloat(feeAmount.toFixed(4)),
        sellerPayout: parseFloat(sellerPayout.toFixed(4)),
        feePercentage
    };
}

/**
 * Record platform fee in database
 */
export async function recordPlatformFee({
    orderId,
    sellerAddress,
    sellerPlan,
    feePercentage,
    feeAmount,
    feeCurrency,
    orderAmount,
    sellerPayout
}: {
    orderId: string;
    sellerAddress: string;
    sellerPlan: string;
    feePercentage: number;
    feeAmount: number;
    feeCurrency: string;
    orderAmount: number;
    sellerPayout: number;
}) {
    const supabase = getSupabaseServerClient();

    try {
        const { error } = await supabase
            .from("platform_fees")
            .insert({
                order_id: orderId,
                seller_address: sellerAddress,
                seller_plan: sellerPlan,
                fee_percentage: feePercentage,
                fee_amount: feeAmount,
                fee_currency: feeCurrency,
                order_amount: orderAmount,
                seller_payout: sellerPayout
            });

        if (error) {
            console.error("Error recording platform fee:", error);
            throw error;
        }

        return true;
    } catch (error) {
        console.error("Failed to record platform fee:", error);
        throw error;
    }
}
