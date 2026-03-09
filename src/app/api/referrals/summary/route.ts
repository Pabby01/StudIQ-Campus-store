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
    .select("address, name, school, campus")
    .or(`referred_by.eq.${referralCode},referred_by.eq.${address}`);

  const { data: existingReferralRows } = await supabase
    .from("points_log")
    .select("id, reason, created_at, points")
    .eq("address", address)
    .ilike("reason", "Referral bonus - %");

  const referralRows = existingReferralRows || [];
  
  // Logic to identify duplicates (same referred user, multiple entries)
  // We normalize the "reason" to extract the identifier (address or name)
  const rowsByReferredUser = new Map<string, typeof referralRows>();
  
  for (const row of referralRows) {
    const identifier = row.reason?.replace("Referral bonus - ", "") || "";
    if (!identifier) continue;
    
    // Check if this identifier matches a profile name or address we know about
    // This helps unify "Referral bonus - John Doe" and "Referral bonus - 0x123..." if they are the same person
    // Ideally we prefer the address format.
    
    // For now, let's group strictly by the reason string first to catch exact duplicates
    const list = rowsByReferredUser.get(identifier) || [];
    list.push(row);
    rowsByReferredUser.set(identifier, list);
  }

  const duplicateIds: string[] = [];
  
  // 1. Clean up exact string duplicates
  for (const list of rowsByReferredUser.values()) {
    if (list.length <= 1) continue;
    // Keep the oldest one, delete others
    const sorted = [...list].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
    duplicateIds.push(...sorted.slice(1).map((row) => row.id));
  }
  
  // 2. Cross-reference Name vs Address duplicates
  // If we have "Referral bonus - [Name]" AND "Referral bonus - [Address]" for the same person, delete the Name one.
  const awardedIdentifiers = new Set(rowsByReferredUser.keys());
  
  for (const profile of referredProfiles || []) {
      if (profile.name && profile.address) {
          const hasNameAward = awardedIdentifiers.has(profile.name);
          const hasAddressAward = awardedIdentifiers.has(profile.address);
          
          if (hasNameAward && hasAddressAward) {
              // We have both! Delete the name one.
              const nameRows = rowsByReferredUser.get(profile.name);
              if (nameRows) {
                  duplicateIds.push(...nameRows.map(r => r.id));
              }
          }
      }
  }

  if (duplicateIds.length > 0) {
    await supabase.from("points_log").delete().in("id", duplicateIds);
  }

  const awardedAddresses = new Set(
    Array.from(rowsByReferredUser.keys())
      .filter(Boolean)
  );

  const eligibleReferred = (referredProfiles || []).filter(
    (profile) => !!profile.name && !!profile.school && !!profile.campus
  );

  const missingAwards = eligibleReferred
    .map((profile) => profile.address)
    .filter(
      (refAddress): refAddress is string => {
        if (!refAddress || refAddress === address) return false;
        
        // Check if address is already awarded
        if (awardedAddresses.has(refAddress)) return false;

        // Check if the user's name is already in the awarded list (legacy data support)
        const profile = eligibleReferred.find(p => p.address === refAddress);
        if (profile?.name && awardedAddresses.has(profile.name)) return false;

        return true;
      }
    );

  if (missingAwards.length > 0) {
    await supabase.from("points_log").insert(
      missingAwards.map((refAddress) => ({
        address,
        points: POINTS.REFERRAL, // This is 100 in constants.ts
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

  const referredAddresses = (referralPointsRows || [])
    .map((row) => row.reason?.replace("Referral bonus - ", "") || "")
    .filter(Boolean);

  const { data: referredProfilesByAddress } = referredAddresses.length
    ? await supabase
        .from("profiles")
        .select("address, name")
        .in("address", referredAddresses)
    : { data: [] };

  const referredNameMap = new Map(
    (referredProfilesByAddress || [])
      .filter((profile) => profile.address)
      .map((profile) => [profile.address, profile.name || null])
  );

  const referralPointsHistory = (referralPointsRows || []).map((row) => {
    const referredAddress = row.reason?.replace("Referral bonus - ", "") || null;
    const referredName = referredAddress ? referredNameMap.get(referredAddress) || null : null;
    return {
      ...row,
      referredAddress,
      referredName,
    };
  });

  const referralPointsTotal = (referralPointsRows || []).reduce(
    (sum, row) => sum + (row.points || 0),
    0
  );

  const response = {
    ok: true,
    referralCode,
    totalReferrals: count ?? 0,
    referralPointsTotal,
    referralPointsHistory,
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
      referredProfiles: eligibleReferred.map((profile) => profile.address),
    },
  });
}
