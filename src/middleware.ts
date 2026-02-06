import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest): string {
    // Use IP address or wallet address for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        // Create new record
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW,
        });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (record.count >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Handle CORS for API sync routes
    if (pathname.startsWith('/api/sync/')) {
        const key = getRateLimitKey(request);
        const { allowed, remaining } = checkRateLimit(key);

        if (!allowed) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Too many requests",
                    code: "RATE_LIMIT_EXCEEDED",
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": MAX_REQUESTS.toString(),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": "60",
                    },
                }
            );
        }

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

        response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        return response;
    }

    // Apply rate limiting to other API routes
    if (pathname.startsWith("/api/")) {
        const key = getRateLimitKey(request);
        const { allowed, remaining } = checkRateLimit(key);

        if (!allowed) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Too many requests",
                    code: "RATE_LIMIT_EXCEEDED",
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": MAX_REQUESTS.toString(),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": "60",
                    },
                }
            );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
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
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)",
    ],
};
