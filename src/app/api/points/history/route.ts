import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("points_log").select("*").eq("address", address).order("created_at", { ascending: false });
  return Response.json(data);
}

