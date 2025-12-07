import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? "";
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json([]);
  }
  const supabase = getSupabaseServerClient();
  let query = supabase.from("products").select("*").limit(50);
  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return Response.json(data);
}
