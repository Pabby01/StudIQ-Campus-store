import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProductSchema } from "@/lib/validators";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const store = await supabase.from("products").select("store_id").eq("id", parsed.data.id).single();
  if (!store.data) return Response.json({ ok: false }, { status: 404 });
  const ownerCheck = await supabase.from("stores").select("owner_address").eq("id", store.data.store_id).single();
  if (!ownerCheck.data || ownerCheck.data.owner_address !== address) return Response.json({ ok: false }, { status: 403 });
  await supabase.from("products").update({
    name: parsed.data.name,
    category: parsed.data.category,
    price: parsed.data.price,
    inventory: parsed.data.inventory,
    image_url: parsed.data.imageUrl ?? null,
  }).eq("id", parsed.data.id);
  return Response.json({ ok: true });
}
