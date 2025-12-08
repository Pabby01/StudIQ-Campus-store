import { getSupabaseServerClient } from "@/lib/supabase";
import { createStoreSchema } from "@/lib/validators";
import { encodeGeohash } from "@/lib/geohash";

export async function POST(req: Request) {
  const body = await req.json();

  // Get address from request body
  const address = body.address;
  if (!address) {
    return Response.json(
      { ok: false, error: "Wallet address required" },
      { status: 401 }
    );
  }

  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid input" },
      { status: 400 }
    );
  }

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

  if (error) {
    console.error("Store creation error:", error);
    return Response.json(
      { ok: false, error: "Failed to create store" },
      { status: 400 }
    );
  }

  // Award 100 points for store creation
  try {
    await fetch(`${req.headers.get("origin")}/api/points/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        points: 100,
        reason: "Store created",
      }),
    });
  } catch (e) {
    console.error("Points award failed:", e);
  }

  return Response.json({ ok: true, id: data.id });
}
