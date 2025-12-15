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
}> {
    const supabase = getSupabaseServerClient();

    try {
        // Get user's current store count
        const { count: storeCount } = await supabase
            .from("stores")
            .select("*", { count: "exact", head: true })
            .eq("owner_address", userAddress);

        // Get user's subscription plan and max stores allowed
        const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select(`
                subscription_plans (
                    name,
                    display_name,
                    max_stores
                )
            `)
            .eq("user_address", userAddress)
            .eq("status", "active")
            .maybeSingle();

        let maxStores = 1; // Default for free tier
        let planName = "Free";

        if (subscription && subscription.subscription_plans) {
            const plan = subscription.subscription_plans as any;
            maxStores = plan.max_stores || 1;
            planName = plan.display_name || "Free";
        }

        const currentCount = storeCount || 0;
        const allowed = currentCount < maxStores;
        const isNearLimit = currentCount >= Math.floor(maxStores * 0.8);

        return {
            allowed,
            currentCount,
            maxAllowed: maxStores,
            planName,
            isNearLimit
        };
    } catch (error) {
        console.error("Error checking store limit:", error);
        // Fail safe: allow creation but log error
        return {
            allowed: true,
            currentCount: 0,
            maxAllowed: 1,
            planName: "Free",
            isNearLimit: false
        };
    }
}

/**
 * Get store limit info for display
 */
export async function getStoreLimitInfo(userAddress: string) {
    const supabase = getSupabaseServerClient();

    try {
        // Get store count
        const { count: storeCount } = await supabase
            .from("stores")
            .select("*", { count: "exact", head: true })
            .eq("owner_address", userAddress);

        // Get subscription info
        const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select(`
                subscription_plans (
                    name,
                    display_name,
                    max_stores
                )
            `)
            .eq("user_address", userAddress)
            .eq("status", "active")
            .maybeSingle();

        let maxStores = 1;
        let planName = "Free";

        if (subscription?.subscription_plans) {
            const plan = subscription.subscription_plans as any;
            maxStores = plan.max_stores || 1;
            planName = plan.display_name || "Free";
        }

        return {
            currentCount: storeCount || 0,
            maxAllowed: maxStores,
            planName,
            percentage: Math.round(((storeCount || 0) / maxStores) * 100)
        };
    } catch (error) {
        console.error("Error getting store limit info:", error);
        return {
            currentCount: 0,
            maxAllowed: 1,
            planName: "Free",
            percentage: 0
        };
    }
}
