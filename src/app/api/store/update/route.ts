import { getSupabaseServerClient } from "@/lib/supabase";
import { updateStoreSchema } from "@/lib/validators";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const parsed = updateStoreSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  await supabase.from("stores").update({
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    lat: parsed.data.lat,
    lon: parsed.data.lon,
    banner_url: parsed.data.bannerUrl ?? null,
  }).eq("id", parsed.data.id).eq("owner_address", address);
  return Response.json({ ok: true });
}
