import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";

const ALLOWED_BUCKETS = new Set(["product-images", "store-banners", "profile-photos", "uploads"]);

export async function POST(req: Request) {
  const address = await getSessionWallet(req);
  if (!address) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bucket, path } = await req.json();

  if (!ALLOWED_BUCKETS.has(bucket)) return Response.json({ ok: false, error: "Invalid bucket" }, { status: 400 });

  // Security check: Ensure the path belongs to the user
  if (!path.includes(address)) {
    return Response.json({ error: "Forbidden: Path must belong to your wallet" }, { status: 403 });
  }

  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false, error: "Server config error" }, { status: 500 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, signedUrl: data.signedUrl, token: data.token });
}
