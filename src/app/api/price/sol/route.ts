import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        // Primary: CoinGecko (Simple Price)
        // Switch to CoinGecko as primary since Jupiter V2 is 401 Unauthorized
        const cgRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CampusStore/1.0'
            },
            next: { revalidate: 60 }
        });

        if (cgRes.ok) {
            const data = await cgRes.json();
            const price = Number(data.solana?.usd);

            if (price && !isNaN(price)) {
                return NextResponse.json({ price, source: 'coingecko' });
            }
        } else {
            console.error(`[PriceProxy] CoinGecko API failed: ${cgRes.status}`);
        }


        // Fallback: CoinGecko
        console.log("[PriceProxy] Switching to CoinGecko fallback");
        const fallbackRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CampusStore/1.0'
            },
            next: { revalidate: 60 }
        });

        if (cgRes.ok) {
            const data = await cgRes.json();
            const price = Number(data.solana?.usd);

            if (price && !isNaN(price)) {
                return NextResponse.json({ price, source: 'coingecko' });
            }
        } else {
            console.error(`[PriceProxy] CoinGecko API failed: ${cgRes.status}`);
        }

        // Deep Fallback: Hardcoded "Safe" Price (Last known average) or Error
        // Better to error than give wrong price, but for demo stability we might want a failsafe.
        // Let's error for now so we know it's broken.
        return NextResponse.json({ error: "Failed to fetch price from all sources" }, { status: 502 });

    } catch (error) {
        console.error("[PriceProxy] Server error details:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
