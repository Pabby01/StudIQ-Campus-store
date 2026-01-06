import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProfileSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Profile validation error:", parsed.error);
      return Response.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Check if profile already exists (by address or email)
    let existing = null;

    // First try to find by address
    const { data: byAddress } = await supabase
      .from("profiles")
      .select("*")
      .eq("address", parsed.data.address)
      .maybeSingle();

    existing = byAddress;

    // If not found by address and email provided, check by email
    if (!existing && parsed.data.email) {
      const { data: byEmail } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", parsed.data.email)
        .maybeSingle();
      existing = byEmail;
    }

    const isNewProfile = !existing;
    const wasIncomplete = existing && (!existing.school || !existing.campus || !existing.name);

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        address: parsed.data.address,
        name: parsed.data.name,
        email: parsed.data.email || null,
        civic_user_id: parsed.data.civic_user_id || null,
        verified_email: parsed.data.verified_email || false,
        school: parsed.data.school,
        campus: parsed.data.campus,
        level: parsed.data.level || null,
        phone: parsed.data.phone || null,
        last_login: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return Response.json(
        { ok: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Award points for new profile or profile completion
    const isComplete = data.name && data.school && data.campus;

    if ((isNewProfile || wasIncomplete) && isComplete) {
      try {
        // Award welcome/profile completion points directly to database
        await supabase.from("points_log").insert({
          address: data.address,
          points: 50,
          reason: isNewProfile ? "Welcome bonus - Profile created" : "Profile completed",
        });
        console.log(`[Profile] Awarded 50 points to ${data.address}`);
      } catch (e) {
        console.error("Points award failed:", e);
      }
    }

    return Response.json({ ok: true, profile: data });
  } catch (error) {
    console.error("Profile error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
