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
        console.log(`[AddressResolver] Resolving email: ${email}`);

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error(`[AddressResolver] Error finding profile by email:`, error);
        }

        console.log(`[AddressResolver] Found profile:`, profile ? { address: profile.address, email: profile.email } : 'none');

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
    console.log(`[AddressResolver] getWalletAddress(${addressOrEmail}) => ${result.address}`);
    return result.address;
}
