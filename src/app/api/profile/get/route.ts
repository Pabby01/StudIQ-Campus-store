import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(null);
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("address", address).maybeSingle();
  return Response.json(data ?? null);
}
