import { getSupabaseServerClient } from "./supabase";

/**
 * Check if user can create a new store based on their subscription plan
 */
export async function canCreateStore(userAddress: string): Promise<{
    allowed: boolean;
    currentCount: number;
    maxAllowed: number;
    planName: string;
    isNearLimit: boolean;
    percentage: number;
}> {
    const supabase = getSupabaseServerClient();

    try {
        // Get user's current store count
        const { count: storeCount } = await supabase
            .from("stores")
            .select("*", { count: "exact", head: true })
            .eq("owner_address", userAddress);

        // Get user's subscription plan
        const { data: subscription, error: subError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_address", userAddress)
            .eq("status", "active")
            .maybeSingle();

        console.log('[Store Limit] Subscription query result:', { subscription, subError, userAddress });

        let maxStores = 1; // Default for free tier
        let planName = "Free";

        if (subscription) {
            // Get the plan details
            const { data: plan } = await supabase
                .from("subscription_plans")
                .select("*")
                .eq("id", subscription.plan_id)
                .single();

            console.log('[Store Limit] Plan data:', plan);

            if (plan) {
                // Use the max_stores from the plan, or derive from plan name
                if (plan.max_stores !== undefined && plan.max_stores !== null) {
                    maxStores = plan.max_stores;
                } else {
                    // Fallback based on plan name if max_stores doesn't exist
                    if (plan.name === 'premium') maxStores = 5;
                    else if (plan.name === 'enterprise') maxStores = 20;
                    else maxStores = 1;
                }
                planName = (plan.name || 'free').charAt(0).toUpperCase() + (plan.name || 'free').slice(1);
            }
        }

        const currentCount = storeCount || 0;
        const allowed = currentCount < maxStores;
        const isNearLimit = currentCount >= Math.floor(maxStores * 0.8);
        const percentage = Math.round((currentCount / maxStores) * 100);

        console.log('[Store Limit] Final result:', { allowed, currentCount, maxStores, planName, percentage });

        return {
            allowed,
            currentCount,
            maxAllowed: maxStores,
            planName,
            isNearLimit,
            percentage
        };
    } catch (error) {
        console.error("Error checking store limit:", error);
        // Fail safe: allow creation but log error
        return {
            allowed: true,
            currentCount: 0,
            maxAllowed: 1,
            planName: "Free",
            isNearLimit: false,
            percentage: 0
        };
    }
}

/**
 * Get store limit info for display
 */
export async function getStoreLimitInfo(userAddress: string) {
    const result = await canCreateStore(userAddress);
    return {
        currentCount: result.currentCount,
        maxAllowed: result.maxAllowed,
        planName: result.planName,
        percentage: result.percentage
    };
}
