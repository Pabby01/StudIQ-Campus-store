import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("wishlists").select("*, products(*)").eq("address", address);
  return Response.json(data ?? []);
}

