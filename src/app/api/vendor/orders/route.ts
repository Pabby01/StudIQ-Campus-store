import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json([]);
  }
  const supabase = getSupabaseServerClient();
  const { data: store } = await supabase.from("stores").select("id").eq("owner_address", address).maybeSingle();
  if (!store) return Response.json([]);
  const { data } = await supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
  return Response.json(data ?? []);
}
