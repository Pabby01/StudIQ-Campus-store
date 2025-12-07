import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") ?? "";
  const supabase = getSupabaseServerClient();
  const { data: store } = await supabase.from("stores").select("id").eq("owner_address", address).maybeSingle();
  if (!store) return Response.json({ storeId: null, products: [] });
  const { data: products } = await supabase.from("products").select("*").eq("store_id", store.id);
  return Response.json({ storeId: store.id, products: products ?? [] });
}

