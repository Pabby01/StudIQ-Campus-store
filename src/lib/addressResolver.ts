import { getSupabaseServerClient } from "@/lib/supabase";

/**
 * Resolves an address parameter to a wallet address
 * Handles both wallet addresses and "email:xxx" format
 */
export async function resolveAddressFromParam(addressOrEmail: string): Promise<{
    address: string | null;
    email: string | null;
    profile: any | null;
}> {
    const supabase = getSupabaseServerClient();

    if (addressOrEmail.startsWith("email:")) {
        const email = addressOrEmail.replace("email:", "");
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        return {
            address: profile?.address || null,
            email,
            profile
        };
    }

    // It's a wallet address, try to find the profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("address", addressOrEmail)
        .maybeSingle();

    return {
        address: addressOrEmail,
        email: profile?.email || null,
        profile
    };
}

/**
 * Simple address resolution - just returns the wallet address
 */
export async function getWalletAddress(addressOrEmail: string): Promise<string | null> {
    const result = await resolveAddressFromParam(addressOrEmail);
    return result.address;
}
