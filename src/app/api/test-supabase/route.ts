import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
    try {
        // Check if env vars are set
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return Response.json({
                ok: false,
                error: "Supabase environment variables not set",
                details: {
                    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                }
            }, { status: 500 });
        }

        const supabase = getSupabaseServerClient();

        // Test 1: Check wallet_auth_nonce table
        const { data: nonceData, error: nonceError } = await supabase
            .from("wallet_auth_nonce")
            .select("*")
            .limit(1);

        // Test 2: Check profiles table
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .limit(1);

        // Test 3: Check products table (if exists)
        const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("*")
            .limit(1);

        // Test 4: Check stores table (if exists)
        const { data: storesData, error: storesError } = await supabase
            .from("stores")
            .select("*")
            .limit(1);

        return Response.json({
            ok: true,
            message: "Supabase connection successful!",
            tests: {
                wallet_auth_nonce: {
                    success: !nonceError,
                    error: nonceError?.message,
                    rowCount: nonceData?.length || 0,
                },
                profiles: {
                    success: !profilesError,
                    error: profilesError?.message,
                    rowCount: profilesData?.length || 0,
                },
                products: {
                    success: !productsError,
                    error: productsError?.message,
                    rowCount: productsData?.length || 0,
                },
                stores: {
                    success: !storesError,
                    error: storesError?.message,
                    rowCount: storesData?.length || 0,
                },
            },
            environment: {
                hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            }
        });
    } catch (error) {
        return Response.json({
            ok: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
}
