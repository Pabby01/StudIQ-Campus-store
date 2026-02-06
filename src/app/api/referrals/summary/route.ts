import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

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

  const referralCode = profile?.referral_code || address;

  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (referralCode && referralCode !== address) {
    query = query.or(`referred_by.eq.${referralCode},referred_by.eq.${address}`);
  } else {
    query = query.eq("referred_by", referralCode);
  }

  const { count } = await query;

  return Response.json({
    ok: true,
    referralCode,
    totalReferrals: count ?? 0,
  });
}
