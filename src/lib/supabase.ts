import { createClient } from "@supabase/supabase-js";

// Client-side SDK initialization has been removed for security reasons.
// All database access must go through API routes using getSupabaseServerClient.

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    throw new Error("supabaseUrl is required.");
  }

  // Use service role key for server-side operations
  // Add custom fetch with longer timeout to prevent connection errors
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Fix: Remove custom fetch with AbortSignal.timeout if it's causing compatibility issues in some environments
    // or simply rely on default fetch which usually has adequate timeouts.
    // If explicit timeout is needed, ensure it's handled correctly.
  });
}
