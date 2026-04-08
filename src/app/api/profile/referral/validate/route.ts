import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
  const sessionAddress = await getSessionWallet(req);
  if (!sessionAddress) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 6) {
    return Response.json({ ok: false, valid: false, error: "Code must be 6 characters" });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("referral_code", code)
    .single();

  if (error || !data) {
    return Response.json({ ok: true, valid: false });
  }

  return Response.json({ ok: true, valid: true, name: data.name });
}
