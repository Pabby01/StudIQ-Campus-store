import { getSupabaseServerClient } from "@/lib/supabase";
import { createStoreSchema } from "@/lib/validators";
import { encodeGeohash } from "@/lib/geohash";
import { canCreateStore } from "@/lib/storeLimit";

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

  // Check store creation limit
  const limitCheck = await canCreateStore(address);
  if (!limitCheck.allowed) {
    return Response.json(
      {
        ok: false,
        error: `Store limit reached. You can create ${limitCheck.maxAllowed} store(s) on the ${limitCheck.planName} plan.`,
        limitReached: true,
        currentCount: limitCheck.currentCount,
        maxAllowed: limitCheck.maxAllowed,
        planName: limitCheck.planName
      },
      { status: 403 }
    );
  }

  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid input" },
      { status: 400 }
    );
  }

  // Ensure profile exists before creating store (foreign key constraint)
  const supabase = getSupabaseServerClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("address")
    .eq("address", address)
    .maybeSingle();

  if (!existingProfile) {
    console.log("[Store Create] Profile not found, creating default profile for:", address);
    // Create a minimal profile to satisfy foreign key constraint
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        address: address,
        name: "User", // Default name, user should complete profile later
        email: null,
        school: null,
        campus: null,
        level: null,
        phone: null,
      });

    if (profileError) {
      console.error("[Store Create] Failed to create profile:", profileError);
      return Response.json(
        { ok: false, error: "Please complete your profile first before creating a store" },
        { status: 400 }
      );
    }
  }

  const geohash = encodeGeohash(parsed.data.lat, parsed.data.lon);

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
