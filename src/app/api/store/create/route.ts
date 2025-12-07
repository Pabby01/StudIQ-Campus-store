import { getSupabaseServerClient } from "@/lib/supabase";
import { createStoreSchema } from "@/lib/validators";
import { encodeGeohash } from "@/lib/geohash";
import { getSessionWalletFromReq } from "@/lib/session";

export async function POST(req: Request) {
  const address = getSessionWalletFromReq(req);
  if (!address) return Response.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const geohash = encodeGeohash(parsed.data.lat, parsed.data.lon);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("stores").insert({
    owner_address: address,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    lat: parsed.data.lat,
    lon: parsed.data.lon,
    geohash,
    banner_url: parsed.data.bannerUrl ?? null,
  }).select("id").single();
  if (error) return Response.json({ ok: false }, { status: 400 });
  return Response.json({ ok: true, id: data.id });
}
