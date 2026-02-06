import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

function generateShortCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function GET(req: Request) {
  const address = await getSessionWallet(req);

  if (!address) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("address, referral_code")
    .eq("address", address)
    .maybeSingle();

  let referralCode = profile?.referral_code || null;
  if (!referralCode || !/^[A-Z0-9]{6}$/.test(referralCode)) {
    let generated = null;
    for (let i = 0; i < 20; i++) {
      const candidate = generateShortCode();
      const { data: clash } = await supabase
        .from("profiles")
        .select("address")
        .eq("referral_code", candidate)
        .maybeSingle();
      if (!clash) {
        generated = candidate;
        break;
      }
    }
    if (generated) {
      referralCode = generated;
      await supabase
        .from("profiles")
        .update({ referral_code: generated })
        .eq("address", address);
    }
  }
  if (!referralCode) {
    return Response.json({ ok: false, error: "Failed to load referral code" }, { status: 500 });
  }

  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  query = query.or(`referred_by.eq.${referralCode},referred_by.eq.${address}`);

  const { count } = await query;

  const { data: referralPointsRows } = await supabase
    .from("points_log")
    .select("points, reason, created_at")
    .eq("address", address)
    .ilike("reason", "Referral bonus - %")
    .order("created_at", { ascending: false })
    .limit(10);

  const referralPointsTotal = (referralPointsRows || []).reduce(
    (sum, row) => sum + (row.points || 0),
    0
  );

  return Response.json({
    ok: true,
    referralCode,
    totalReferrals: count ?? 0,
    referralPointsTotal,
    referralPointsHistory: referralPointsRows || [],
  });
}
