import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = (url.searchParams.get("geoprefix") ?? "").trim();
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json([]);
  }
  const supabase = getSupabaseServerClient();

  const prefixes: string[] = [];
  if (prefix) {
    for (let len = Math.min(prefix.length, 6); len >= 3; len -= 1) {
      prefixes.push(prefix.slice(0, len));
    }
  }
  prefixes.push("");

  for (const activePrefix of prefixes) {
    const query = supabase.from("stores").select("*").limit(50);
    const { data } = activePrefix
      ? await query.ilike("geohash", `${activePrefix}%`)
      : await query;

    if (Array.isArray(data) && data.length > 0) {
      return Response.json(data);
    }
  }

  return Response.json([]);
}
