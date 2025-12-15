import { getSupabaseServerClient } from "./supabase";

/**
 * Verify if user owns a store
 */
export async function verifyStoreOwnership(
    storeId: string,
    userAddress: string
): Promise<boolean> {
    const supabase = getSupabaseServerClient();

    try {
        const { data: store } = await supabase
            .from("stores")
            .select("owner_address")
            .eq("id", storeId)
            .single();

        return store?.owner_address === userAddress;
    } catch (error) {
        console.error("Error verifying store ownership:", error);
        return false;
    }
}

/**
 * Verify if user owns a product (via the store)
 */
export async function verifyProductOwnership(
    productId: string,
    userAddress: string
): Promise<boolean> {
    const supabase = getSupabaseServerClient();

    try {
        const { data: product } = await supabase
            .from("products")
            .select("stores(owner_address)")
            .eq("id", productId)
            .single();

        if (!product || !product.stores) {
            return false;
        }

        const store = product.stores as any;
        return store.owner_address === userAddress;
    } catch (error) {
        console.error("Error verifying product ownership:", error);
        return false;
    }
}

/**
 * Get user's stores
 */
export async function getUserStores(userAddress: string) {
    const supabase = getSupabaseServerClient();

    try {
        const { data: stores, error } = await supabase
            .from("stores")
            .select("*")
            .eq("owner_address", userAddress)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return stores || [];
    } catch (error) {
        console.error("Error getting user stores:", error);
        return [];
    }
}
