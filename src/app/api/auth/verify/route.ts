import bs58 from "bs58";
import nacl from "tweetnacl";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address, nonce, signature } = await req.json();

    if (!address || !nonce || !signature) {
      return Response.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Verify nonce exists and hasn't expired
    const { data } = await supabase
      .from("wallet_auth_nonce")
      .select("nonce, expires_at")
      .eq("address", address)
      .single();

    if (!data || data.nonce !== nonce) {
      return Response.json(
        { ok: false, error: "Invalid or expired nonce" },
        { status: 401 }
      );
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return Response.json(
        { ok: false, error: "Nonce expired" },
        { status: 401 }
      );
    }

    // Verify signature - sign the nonce directly
    const messageBytes = new TextEncoder().encode(nonce);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(address);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return Response.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Create or update profile
    await supabase.from("profiles").upsert({ address }).select();

    // Delete used nonce
    await supabase.from("wallet_auth_nonce").delete().eq("address", address);

    // Set session cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.set("sid", address, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Auth verification error:", error);
    return Response.json(
      { ok: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
