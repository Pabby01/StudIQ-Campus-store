import { getSupabaseServerClient } from "@/lib/supabase";
import { updateStoreSchema } from "@/lib/validators";
import { encodeGeohash } from "@/lib/geohash";

export async function POST(req: Request) {
  const body = await req.json();
  const address = body.address;

  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  const parsed = updateStoreSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid input" },
      { status: 400 }
    );
  }

  const geohash = encodeGeohash(parsed.data.lat, parsed.data.lon);
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("stores").update({
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    lat: parsed.data.lat,
    lon: parsed.data.lon,
    geohash,
    banner_url: parsed.data.bannerUrl ?? null,
  }).eq("id", parsed.data.id).eq("owner_address", address);

  if (error) {
    console.error("Store update error:", error);
    return Response.json(
      { ok: false, error: "Failed to update store" },
      { status: 400 }
    );
  }

  return Response.json({ ok: true });
}
