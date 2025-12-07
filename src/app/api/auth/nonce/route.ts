import { getSupabaseServerClient } from "@/lib/supabase";
import { randomUUID } from "node:crypto";

export async function POST(req: Request) {
  const { address } = await req.json();
  const nonce = randomUUID();
  const supabase = getSupabaseServerClient();
  await supabase.from("wallet_auth_nonce").upsert({ address, nonce, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  return Response.json({ nonce });
}

