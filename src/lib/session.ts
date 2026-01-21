import { getSupabaseServerClient } from "./supabase";

/**
 * Gets the verified wallet address from the session cookie.
 * Highly secure as it checks the database for a valid, non-expired session UUID.
 */
export async function getSessionWallet(req: Request): Promise<string | null> {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s)sid=([^;]+)/);
  const sessionId = match ? match[1] : null;

  if (!sessionId) return null;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("secure_sessions")
      .select("user_address")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') { // Not 'no rows'
        console.error("Session lookup error:", error);
      }
      return null;
    }

    return data.user_address;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

// Keep the old name as an alias for now, but mark it as async
export const getSessionWalletFromReq = getSessionWallet;
