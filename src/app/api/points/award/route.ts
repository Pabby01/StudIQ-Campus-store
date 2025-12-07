import { getSupabaseServerClient } from "@/lib/supabase";
import { awardPointsSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = awardPointsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const current = await supabase.from("profiles").select("points").eq("address", parsed.data.address).maybeSingle();
  const base = Number(current.data?.points ?? 0);
  await supabase.from("profiles").update({ points: base + parsed.data.points }).eq("address", parsed.data.address);
  await supabase.from("points_log").insert({ address: parsed.data.address, points: parsed.data.points, reason: parsed.data.reason });
  return Response.json({ ok: true });
}
