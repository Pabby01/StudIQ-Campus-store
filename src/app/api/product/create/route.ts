import { getSupabaseServerClient } from "@/lib/supabase";
import { createProductSchema } from "@/lib/validators";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const ownerCheck = await supabase.from("stores").select("owner_address").eq("id", parsed.data.storeId).single();
  if (!ownerCheck.data || ownerCheck.data.owner_address !== address) return Response.json({ ok: false }, { status: 403 });
  const { data, error } = await supabase.from("products").insert({
    store_id: parsed.data.storeId,
    name: parsed.data.name,
    category: parsed.data.category,
    price: parsed.data.price,
    inventory: parsed.data.inventory,
    image_url: parsed.data.imageUrl ?? null,
  }).select("id").single();
  if (error) return Response.json({ ok: false }, { status: 400 });
  return Response.json({ ok: true, id: data.id });
}
