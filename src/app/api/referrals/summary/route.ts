import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";
import { POINTS } from "@/lib/constants";

function generateShortCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
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

  const { data: referredProfiles } = await supabase
    .from("profiles")
    .select("address")
    .or(`referred_by.eq.${referralCode},referred_by.eq.${address}`);

  const { data: existingReferralRows } = await supabase
    .from("points_log")
    .select("reason")
    .eq("address", address)
    .ilike("reason", "Referral bonus - %");

  const awardedAddresses = new Set(
    (existingReferralRows || [])
      .map((row) => row.reason?.replace("Referral bonus - ", "") || "")
      .filter(Boolean)
  );

  const missingAwards = (referredProfiles || [])
    .map((profile) => profile.address)
    .filter(
      (refAddress): refAddress is string =>
        !!refAddress && refAddress !== address && !awardedAddresses.has(refAddress)
    );

  if (missingAwards.length > 0) {
    await supabase.from("points_log").insert(
      missingAwards.map((refAddress) => ({
        address,
        points: POINTS.REFERRAL,
        reason: `Referral bonus - ${refAddress}`,
      }))
    );
  }

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

  const response = {
    ok: true,
    referralCode,
    totalReferrals: count ?? 0,
    referralPointsTotal,
    referralPointsHistory: referralPointsRows || [],
  };

  if (!debug) {
    return Response.json(response);
  }

  return Response.json({
    ...response,
    debug: {
      awardedCount: awardedAddresses.size,
      missingCount: missingAwards.length,
      awardedAddresses: Array.from(awardedAddresses),
      missingAwards,
      referredProfiles: (referredProfiles || []).map((profile) => profile.address),
    },
  });
}
