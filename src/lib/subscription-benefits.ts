import { getSupabaseServerClient } from "@/lib/supabase";

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userAddress: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();

    const { data } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_address", userAddress)
        .single();

    if (!data) return false;

    // Check if subscription is active and not expired
    const isActive = data.status === 'active';
    const notExpired = new Date(data.expires_at) > new Date();

    return isActive && notExpired;
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userAddress: string) {
    const supabase = getSupabaseServerClient();

    const { data } = await supabase
        .from("user_subscriptions")
        .select(`
      *,
      subscription_plans (
        name,
        max_stores,
        platform_fee
      )
    `)
        .eq("user_address", userAddress)
        .single();

    return data;
}

/**
 * Get subscription tier name
 */
export async function getSubscriptionTier(userAddress: string): Promise<'free' | 'premium' | 'enterprise'> {
    const subscription = await getUserSubscription(userAddress);
    return subscription?.subscription_plans?.name || 'free';
}

/**
 * Check if user has premium or higher
 */
export async function isPremiumUser(userAddress: string): Promise<boolean> {
    const tier = await getSubscriptionTier(userAddress);
    return tier === 'premium' || tier === 'enterprise';
}

/**
 * Check if user has enterprise subscription
 */
export async function isEnterpriseUser(userAddress: string): Promise<boolean> {
    const tier = await getSubscriptionTier(userAddress);
    return tier === 'enterprise';
}

/**
 * Get platform fee for user based on subscription
 */
export async function getPlatformFeeForUser(userAddress: string): Promise<number> {
    const subscription = await getUserSubscription(userAddress);
    return subscription?.subscription_plans?.platform_fee ?? 5; // Default 5% for free tier
}

/**
 * Get max stores allowed for user
 */
export async function getMaxStoresForUser(userAddress: string): Promise<number> {
    const subscription = await getUserSubscription(userAddress);
    return subscription?.subscription_plans?.max_stores ?? 1; // Default 1 for free tier
}

/**
 * Apply subscription benefits to user profile
 */
export async function applySubscriptionBenefits(userAddress: string) {
    const tier = await getSubscriptionTier(userAddress);
    const supabase = getSupabaseServerClient();

    // Update profile with subscription tier
    await supabase
        .from("profiles")
        .update({
            subscription_tier: tier,
            updated_at: new Date().toISOString()
        })
        .eq("address", userAddress);

    return { tier };
}

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export async function isSubscriptionExpiringSoon(userAddress: string): Promise<boolean> {
    const subscription = await getUserSubscription(userAddress);

    if (!subscription || subscription.status !== 'active') return false;

    const expiresAt = new Date(subscription.expires_at);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return expiresAt <= sevenDaysFromNow;
}

/**
 * Auto-expire subscriptions that have passed their expiry date
 * Should be run as a cron job
 */
export async function expireOldSubscriptions() {
    const supabase = getSupabaseServerClient();

    const { data: expiredSubs } = await supabase
        .from("user_subscriptions")
        .select("id, user_address")
        .eq("status", "active")
        .lt("expires_at", new Date().toISOString());

    if (expiredSubs && expiredSubs.length > 0) {
        // Mark as expired
        await supabase
            .from("user_subscriptions")
            .update({ status: "expired" })
            .in("id", expiredSubs.map(s => s.id));

        // Reset user profiles to free tier
        await supabase
            .from("profiles")
            .update({ subscription_tier: "free" })
            .in("address", expiredSubs.map(s => s.user_address));

        return expiredSubs.length;
    }

    return 0;
}
