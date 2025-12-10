import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("geoprefix") ?? "";
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json([]);
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("stores").select("*").ilike("geohash", `${prefix}%`).limit(50);
  return Response.json(data);
}
