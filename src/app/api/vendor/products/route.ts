import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
  const address = await getSessionWallet(req);

  if (!address) {
    return Response.json({ error: "Unauthorized: Active session required" }, { status: 401 });
  }

  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ storeId: null, products: [] });
  }

  const supabase = getSupabaseServerClient();
  const { data: store } = await supabase.from("stores").select("id").eq("owner_address", address).maybeSingle();
  if (!store) return Response.json({ storeId: null, products: [] });
  const { data: products } = await supabase.from("products").select("*").eq("store_id", store.id);
  return Response.json({ storeId: store.id, products: products ?? [] });
}
