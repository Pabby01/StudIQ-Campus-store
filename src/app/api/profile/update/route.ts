import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProfileSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Check if this is a new profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("address")
      .eq("address", parsed.data.address)
      .maybeSingle();

    const isNewProfile = !existing;

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        address: parsed.data.address,
        name: parsed.data.name,
        email: parsed.data.email || null,
        school: parsed.data.school,
        campus: parsed.data.campus,
        level: parsed.data.level || null,
        phone: parsed.data.phone || null,
        updated_at: new Date().toISOString(),
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

    // Award 50 points for new account
    if (isNewProfile) {
      try {
        await fetch(`${req.headers.get("origin")}/api/points/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: parsed.data.address,
            points: 50,
            reason: "Account created",
          }),
        });
      } catch (e) {
        console.error("Points award failed:", e);
      }
    }

    return Response.json({ ok: true, profile: data });
  } catch (error) {
    console.error("Profile update error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
