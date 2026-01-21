import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const address = await getSessionWallet(req);

  if (!address) {
    return Response.json(null, { status: 401 });
  }

  if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json(null);
  }

  // Uses SUPABASE_SERVICE_ROLE_KEY internally
  const supabase = getSupabaseServerClient();

  const { data } = await supabase.from("profiles").select("*").eq("address", address).maybeSingle();

  return Response.json(data ?? null);
}
