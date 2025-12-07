import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("geoprefix") ?? "";
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("stores").select("*").ilike("geohash", `${prefix}%`).limit(50);
  return Response.json(data);
}

