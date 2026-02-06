import { getSupabaseServerClient } from "@/lib/supabase";
import { createStoreSchema } from "@/lib/validators";
import { encodeGeohash } from "@/lib/geohash";
import { canCreateStore } from "@/lib/storeLimit";
import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
  const sessionAddress = await getSessionWallet(req);
  if (!sessionAddress) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const address = sessionAddress;

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
    delivery_enabled: parsed.data.deliveryEnabled ?? true,
    pickup_enabled: parsed.data.pickupEnabled ?? true,
    delivery_fee: parsed.data.deliveryFee ?? 0,
    delivery_notes: parsed.data.deliveryNotes ?? null,
  }).select("id").single();

  if (error) {
    console.error("Store creation error:", error);
    return Response.json(
      { ok: false, error: "Failed to create store" },
      { status: 400 }
    );
  }

  // Award bonus points for store creation
  try {
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${origin}/api/points/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SYNC_API_KEY}`
      },
      body: JSON.stringify({
        address,
        points: 50, // Bonus for starting a store
        reason: "Store created",
      }),
    });
  } catch (e) {
    console.error("Points award failed:", e);
  }

  return Response.json({ ok: true, id: data.id });
}
