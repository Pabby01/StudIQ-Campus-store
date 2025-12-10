import { getSupabaseServerClient } from "@/lib/supabase";

const ALLOWED_BUCKETS = new Set(["product-images", "store-banners", "profile-photos"]);

export async function POST(req: Request) {
  const { bucket, path } = await req.json();
  if (!ALLOWED_BUCKETS.has(bucket)) return Response.json({ ok: false }, { status: 400 });
  if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false });
  }
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) return Response.json({ ok: false }, { status: 400 });
  return Response.json({ ok: true, signedUrl: data.signedUrl, token: data.token });
}
