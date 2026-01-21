import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

export async function GET(req: Request) {
  const address = await getSessionWallet(req);

  if (!address) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("points_log")
    .select("*")
    .eq("address", address)
    .order("created_at", { ascending: false });

  return Response.json(data);
}
