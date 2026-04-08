import { createRemoteJWKSet, jwtVerify } from "jose";

// Cache the JWKS so we don't refetch on every request
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL("https://auth.civic.com/.well-known/jwks.json"));
    }
    return jwks;
}

/**
 * Verifies a Civic Auth JWT token using Civic's public JWKS endpoint.
 * Fully validates the signature — not just the payload claims.
 */
export async function verifyCivicToken(token: string) {
    try {
        const clientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;
        if (!clientId) throw new Error("Civic Client ID not configured");

        const { payload } = await jwtVerify(token, getJWKS(), {
            audience: clientId,
        });

        return {
            success: true,
            userId: payload.sub as string,
            email: payload["email"] as string | undefined,
            verified: payload["email_verified"] as boolean | undefined,
        };
    } catch (error) {
        console.error("[Civic Verify] Failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
