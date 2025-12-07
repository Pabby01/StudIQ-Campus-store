import bs58 from "bs58";
import nacl from "tweetnacl";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address, nonce, signature } = await req.json();

    console.log("Auth verify request:", { address, nonce, signatureLength: signature?.length });

    if (!address || !nonce || !signature) {
      console.error("Missing fields:", { address: !!address, nonce: !!nonce, signature: !!signature });
      return Response.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase not configured");
      return Response.json(
        { ok: false, error: "Server configuration error - Supabase not set up" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Verify nonce exists and hasn't expired
    const { data, error: nonceError } = await supabase
      .from("wallet_auth_nonce")
      .select("nonce, expires_at")
      .eq("address", address)
      .single();

    if (nonceError) {
      console.error("Nonce lookup error:", nonceError);
      return Response.json(
        { ok: false, error: `Database error: ${nonceError.message}. Make sure to run auth_schema.sql in Supabase!` },
        { status: 500 }
      );
    }

    if (!data || data.nonce !== nonce) {
      console.error("Nonce mismatch:", { found: !!data, matches: data?.nonce === nonce });
      return Response.json(
        { ok: false, error: "Invalid or expired nonce" },
        { status: 401 }
      );
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      console.error("Nonce expired");
      return Response.json(
        { ok: false, error: "Nonce expired" },
        { status: 401 }
      );
    }

    // Verify signature - sign the nonce directly
    try {
      const messageBytes = new TextEncoder().encode(nonce);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(address);

      console.log("Verifying signature:", {
        messageLength: messageBytes.length,
        signatureLength: signatureBytes.length,
        publicKeyLength: publicKeyBytes.length,
      });

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!isValid) {
        console.error("Signature verification failed");
        return Response.json(
          { ok: false, error: "Invalid signature - please try connecting again" },
          { status: 401 }
        );
      }

      console.log("Signature verified successfully");
    } catch (sigError) {
      console.error("Signature verification error:", sigError);
      return Response.json(
        { ok: false, error: `Signature error: ${sigError instanceof Error ? sigError.message : 'Unknown error'}` },
        { status: 401 }
      );
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ address })
      .select();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Continue anyway - profile creation is not critical
    }

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

    console.log("Auth successful for:", address);
    return res;
  } catch (error) {
    console.error("Auth verification error:", error);
    return Response.json(
      { ok: false, error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
