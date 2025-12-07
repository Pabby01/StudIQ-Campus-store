import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("address", address).maybeSingle();
  return Response.json(data ?? null);
}

