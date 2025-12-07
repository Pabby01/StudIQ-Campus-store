import { getSupabaseServerClient } from "@/lib/supabase";
import { updateProfileSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const supabase = getSupabaseServerClient();
  await supabase.from("profiles").update({
    name: parsed.data.name,
    school: parsed.data.school,
    campus: parsed.data.campus,
    level: parsed.data.level,
    phone: parsed.data.phone,
  }).eq("address", parsed.data.address);
  return Response.json({ ok: true });
}

