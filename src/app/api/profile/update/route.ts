import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProfileSchema } from "@/lib/validators";
import { POINTS } from "@/lib/constants";
import { getSessionWallet } from "@/lib/session";

function generateShortCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Profile Update] Received:", body);

    const sessionAddress = await getSessionWallet(req);
    if (!sessionAddress) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[Profile Update] Validation error:", parsed.error);
      return Response.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const referralCode = parsed.data.referralCode
      ? parsed.data.referralCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : null;

    // Verify session matches the address in the request
    if (sessionAddress !== parsed.data.address) {
      return Response.json({ ok: false, error: "Forbidden: You can only update your own profile" }, { status: 403 });
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

    console.log("[Profile Update] isNewProfile:", isNewProfile, "wasIncomplete:", wasIncomplete);

    // Ensure a short unique referral_code
    let referral_code_to_use = existing?.referral_code;
    if (!referral_code_to_use || !/^[A-Z0-9]{6}$/.test(referral_code_to_use)) {
      for (let i = 0; i < 20; i++) {
        const candidate = generateShortCode();
        const { data: clash } = await supabase
          .from("profiles")
          .select("address")
          .eq("referral_code", candidate)
          .maybeSingle();
        if (!clash) {
          referral_code_to_use = candidate;
          break;
        }
      }
      if (!referral_code_to_use) {
        return Response.json(
          { ok: false, error: "Failed to generate referral code" },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        address: parsed.data.address,
        name: parsed.data.name,
        // Use provided value, or fall back to existing value, or null/default
        email: parsed.data.email ?? existing?.email ?? null,
        civic_user_id: parsed.data.civic_user_id ?? existing?.civic_user_id ?? null,
        verified_email: parsed.data.verified_email ?? existing?.verified_email ?? false,
        school: parsed.data.school,
        campus: parsed.data.campus,
        level: parsed.data.level || existing?.level || null,
        phone: parsed.data.phone || existing?.phone || null,
        referral_code: referral_code_to_use,
        referred_by: existing?.referred_by ?? (referralCode && referralCode.length === 6 ? referralCode : null),
        last_login: new Date().toISOString(),
      }, { onConflict: 'address' })
      .select()
      .single();

    if (error) {
      console.error("[Profile Update] Update error:", error);
      return Response.json(
        { ok: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Award points for new profile or profile completion
    const isComplete = data.name && data.school && data.campus;
    console.log("[Profile Update] isComplete:", isComplete);

    if ((isNewProfile || wasIncomplete) && isComplete) {
      try {
        // Check if we already awarded points to this profile
        const { data: existingPoints } = await supabase
          .from("points_log")
          .select("id")
          .eq("address", data.address)
          .eq("reason", "Welcome bonus - Profile created")
          .maybeSingle();

        if (!existingPoints) {
          // Award welcome/profile completion points
          const { error: pointsError } = await supabase.from("points_log").insert({
            address: data.address,
            points: POINTS.PROFILE_COMPLETE,
            reason: isNewProfile ? "Welcome bonus - Profile created" : "Profile completed",
          });

          if (pointsError) {
            console.error("[Profile Update] Points insert error:", pointsError);
          } else {
            console.log(`[Profile Update] ✅ Awarded 50 points to ${data.address}`);
          }
        } else {
          console.log("[Profile Update] Points already awarded to:", data.address);
        }
      } catch (e) {
        console.error("[Profile Update] Points award failed:", e);
      }
    }

    const shouldAwardReferral =
      referralCode && referralCode.length === 6 && !existing?.referred_by;

    if (shouldAwardReferral) {
      try {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("address")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (referrer?.address && referrer.address !== data.address) {
          const referralReason = `Referral bonus - ${data.address}`;
          const { data: existingReferral } = await supabase
            .from("points_log")
            .select("id")
            .eq("address", referrer.address)
            .eq("reason", referralReason)
            .maybeSingle();

          if (!existingReferral) {
            const { error: referralError } = await supabase.from("points_log").insert({
              address: referrer.address,
              points: POINTS.REFERRAL,
              reason: referralReason,
            });

            if (referralError) {
              console.error("[Profile Update] Referral points insert error:", referralError);
            }
          }
        }
      } catch (e) {
        console.error("[Profile Update] Referral award failed:", e);
      }
    }

    return Response.json({ ok: true, profile: data });
  } catch (error) {
    console.error("[Profile Update] Error:", error);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
