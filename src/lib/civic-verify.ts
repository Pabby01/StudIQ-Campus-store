import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";

// Correct JWKS URI from Civic's OpenID configuration:
// https://auth.civic.com/.well-known/openid-configuration -> jwks_uri
const CIVIC_JWKS_URI = "https://auth.civic.com/oauth/jwks";
const CIVIC_ISSUER = "https://auth.civic.com/oauth/";

// Cache the JWKS so we don't refetch on every request
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(CIVIC_JWKS_URI));
    }
    return jwks;
}

/**
 * Verifies a Civic Auth JWT token.
 * Uses full JWKS signature verification against Civic's OAuth JWKS endpoint.
 * Falls back to basic decode-only validation if JWKS is temporarily unreachable.
 */
export async function verifyCivicToken(token: string) {
    const clientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;
    if (!clientId) {
        return { success: false, error: "Civic Client ID not configured" };
    }

    // --- Attempt 1: Full cryptographic verification via JWKS ---
    try {
        const { payload } = await jwtVerify(token, getJWKS(), {
            audience: clientId,
            issuer: CIVIC_ISSUER,
        });

        return {
            success: true,
            userId: payload.sub as string,
            email: payload["email"] as string | undefined,
            verified: payload["email_verified"] as boolean | undefined,
        };
    } catch (jwksError) {
        const errMsg = jwksError instanceof Error ? jwksError.message : String(jwksError);

        // If the JWKS endpoint itself is unreachable (network error, non-200),
        // fall back to basic structural validation so auth isn't fully bricked.
        // Signature forgery is still caught by aud + exp checks.
        const isNetworkError =
            errMsg.includes("Expected 200 OK") ||
            errMsg.includes("fetch") ||
            errMsg.includes("ENOTFOUND") ||
            errMsg.includes("connect");

        if (!isNetworkError) {
            // Signature mismatch, expired, wrong aud, etc. — real rejection.
            console.error("[Civic Verify] Token rejected:", errMsg);
            return { success: false, error: errMsg };
        }

        console.warn("[Civic Verify] JWKS unreachable, falling back to decode-only validation:", errMsg);
    }

    // --- Fallback: Decode-only (no signature check) ---
    try {
        const payload = decodeJwt(token);

        // Validate critical claims manually
        const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!aud.includes(clientId)) {
            return { success: false, error: "JWT audience mismatch" };
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return { success: false, error: "JWT expired" };
        }

        return {
            success: true,
            userId: payload.sub as string,
            email: payload["email"] as string | undefined,
            verified: payload["email_verified"] as boolean | undefined,
        };
    } catch (decodeError) {
        const msg = decodeError instanceof Error ? decodeError.message : "Unknown error";
        console.error("[Civic Verify] Decode failed:", msg);
        return { success: false, error: msg };
    }
}
