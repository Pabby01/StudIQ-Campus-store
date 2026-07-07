import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = process.env.NODE_ENV === "production" ? 120 : 1000;
const HIGH_MAX_REQUESTS = process.env.NODE_ENV === "production" ? 600 : 2000;

// Upstash Redis implementation conditionally initialized
const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;
const rateLimit = hasRedis ? new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
}) : null;

function getRateLimitKey(req: NextRequest, bucket: string): string {
    const sessionId = req.cookies.get("sid")?.value;
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "";
    const userAgent = req.headers.get("user-agent") || "";
    const identity = sessionId ? `sid:${sessionId}` : ip ? `ip:${ip}` : userAgent ? `ua:${userAgent}` : "unknown";
    return `${bucket}:${identity}`;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method.toUpperCase();

    const isFinancialRoute = 
        pathname.startsWith("/api/checkout/") || 
        pathname.startsWith("/api/escrow/");

    if (isFinancialRoute && rateLimit) {
        const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
        const { success, limit, remaining, reset } = await rateLimit.limit(`ratelimit_${ip}`);

        if (!success) {
            return NextResponse.json(
                { ok: false, error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString()
                    }
                }
            );
        }
    }

    // Handle CORS for API sync routes
    if (pathname.startsWith('/api/sync/')) {
        const response = NextResponse.next();

        // CORS headers for sync API
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            'https://www.studiq.fun',
            'https://studiq.fun',
            'https://store.studiq.fun',
            'http://localhost:3000',
            'http://localhost:3001'
        ];

        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sync-API-Key');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
        }

        // Handle OPTIONS preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: response.headers
            });
        }

        return response;
    }

    // Security headers for all routes
    const response = NextResponse.next();

    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // XSS Protection
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Referrer Policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Allow cross-origin embeds needed for Civic auth and third-party scripts
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");

    // Content Security Policy (updated for Civic Auth, Metakeep, and Solana wallets)
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "img-src 'self' data: https: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.civic.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.civic.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "media-src 'self' data: blob:; " +
        "frame-src 'self' https://connect.solflare.com https://phantom.app https://*.civic.com https://auth.metakeep.xyz https://*.metakeep.xyz; " +
        "connect-src 'self' https://studiq.fun https://www.studiq.fun https://store.studiq.fun https://api.devnet.solana.com https://api.mainnet-beta.solana.com wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com https://*.helius-rpc.com wss://*.helius-rpc.com https://mainnet.helius-rpc.com wss://mainnet.helius-rpc.com https://*.supabase.co wss://*.supabase.co https://connect.solflare.com https://*.civic.com https://*.metakeep.xyz https://sepolia-preconf.base.org https://mainnet.base.org https://price.jup.ag https://api.jup.ag https://*.paj.cash;"
    );

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|lpgo.jpg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)",
    ],
};
