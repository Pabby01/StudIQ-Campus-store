import { getSupabaseServerClient } from "@/lib/supabase";

// Admin authentication helper
export async function isAdmin(address: string | null): Promise<boolean> {
    if (!address) return false;

    // Check environment variable list first (fast)
    const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
        .split(",")
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

    if (adminAddresses.includes(address)) return true;

    // Check email via database if ADMIN_EMAIL is set
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    if (!adminEmail) return false;

    try {
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("address", address)
            .single();

        return profile?.email === adminEmail;
    } catch (error) {
        console.error("Admin auth check failed:", error);
        return false;
    }
}

export async function requireAdmin(address: string | null) {
    if (!(await isAdmin(address))) {
        throw new Error("Unauthorized: Admin access required");
    }
}

