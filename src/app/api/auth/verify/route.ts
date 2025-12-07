import bs58 from "bs58";
import nacl from "tweetnacl";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address, nonce, signature } = await req.json();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("wallet_auth_nonce").select("nonce, expires_at").eq("address", address).single();
  if (!data || data.nonce !== nonce) return Response.json({ ok: false }, { status: 401 });
  if (new Date(data.expires_at).getTime() < Date.now()) return Response.json({ ok: false }, { status: 401 });
  const msg = new TextEncoder().encode(nonce);
  const sig = bs58.decode(signature);
  const pub = bs58.decode(address);
  const ok = nacl.sign.detached.verify(msg, sig, pub);
  if (!ok) return Response.json({ ok: false }, { status: 401 });
  await supabase.from("profiles").upsert({ address }).select();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sid", address, { path: "/", httpOnly: true });
  return res;
}
