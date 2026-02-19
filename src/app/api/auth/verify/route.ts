import bs58 from "bs58";
import nacl from "tweetnacl";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { verifyCivicToken } from "@/lib/civic-verify";

export async function POST(req: Request) {
  try {
    const { address, nonce, signature, token } = await req.json();

    let verifiedAddress = address;
    let civicEmail: string | null = null;

    // Method A: Civic Token Verification
    if (token) {
      const civicResult = await verifyCivicToken(token);
      if (!civicResult.success || !civicResult.email) {
        return Response.json(
          { ok: false, error: civicResult.error || "Invalid Civic token" },
          { status: 401 }
        );
      }
      civicEmail = civicResult.email;

      // If address was provided, use it; otherwise try to find it via email
      if (address) {
        verifiedAddress = address;
      } else {
        const supabase = getSupabaseServerClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("address")
          .eq("email", civicEmail)
          .maybeSingle();

        if (!profile) {
          return Response.json(
            { ok: false, error: "Profile not found for this email. Please connect wallet first." },
            { status: 404 }
          );
        }
        verifiedAddress = profile.address;
      }
    }
    // Method B: Traditional Signature Verification
    else {
      if (!address || !nonce || !signature) {
        console.error("Missing fields:", { address: !!address, nonce: !!nonce, signature: !!signature });
        return Response.json(
          { ok: false, error: "Missing required fields (address, nonce, signature)" },
          { status: 400 }
        );
      }

      if ((!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
          { ok: false, error: `Database error: ${nonceError.message}` },
          { status: 500 }
        );
      }

      if (!data || data.nonce !== nonce) {
        console.error("Nonce mismatch");
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

      // Verify signature
      try {
        const messageBytes = new TextEncoder().encode(nonce);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(address);

        const isValid = nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          publicKeyBytes
        );

        if (!isValid) {
          console.error("Signature verification failed");
          return Response.json(
            { ok: false, error: "Invalid signature" },
            { status: 401 }
          );
        }

        // Delete used nonce
        await supabase.from("wallet_auth_nonce").delete().eq("address", address);
      } catch (sigError) {
        console.error("Signature verification error:", sigError);
        return Response.json(
          { ok: false, error: "Signature verification failed" },
          { status: 401 }
        );
      }
    }

    const supabase = getSupabaseServerClient();
    const addressToUse = verifiedAddress;

    // Create or update profile
    // We specify onConflict: 'address' to handle the unique constraint properly
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        address: addressToUse,
        ...(civicEmail ? { email: civicEmail } : {})
      }, { onConflict: 'address' })
      .select();

    if (profileError) {
      // If it's just a duplicate key error for email (someone else has this email), legacy login still works
      if (profileError.code !== '23505') {
        console.error("Profile creation error:", profileError);
      }
    }

    // Create a secure session in the database
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days

    const { data: session, error: sessionError } = await supabase
      .from("secure_sessions")
      .insert({
        user_address: addressToUse,
        expires_at: expiry.toISOString()
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("Failed to create secure session:", sessionError);
      return Response.json({ ok: false, error: "Authentication failed - session creation error" }, { status: 500 });
    }

    // Set session cookie with the secure UUID
    const res = NextResponse.json({ ok: true, address: addressToUse });
    res.cookies.set("sid", session.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("Auth successful for:", addressToUse, "Session:", session.id);
    return res;
  } catch (error) {
    console.error("Auth verification error:", error);
    return Response.json(
      { ok: false, error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
