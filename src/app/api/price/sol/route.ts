import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        // Primary: Jupiter Price API V2
        // Adding headers to mimic a browser/valid client if needed, or just standard API usage
        const jupiterRes = await fetch("https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112", {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CampusStore/1.0'
            },
            next: { revalidate: 60 }
        });

        if (jupiterRes.ok) {
            const data = await jupiterRes.json();
            const price = Number(data.data["So11111111111111111111111111111111111111112"]?.price);

            if (price && !isNaN(price)) {
                return NextResponse.json({ price, source: 'jupiter' });
            }
        } else {
            console.warn(`[PriceProxy] Jupiter API failed: ${jupiterRes.status}`);
        }

        // Fallback: CoinGecko
        console.log("[PriceProxy] Switching to CoinGecko fallback");
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

        // Deep Fallback: Hardcoded "Safe" Price (Last known average) or Error
        // Better to error than give wrong price, but for demo stability we might want a failsafe.
        // Let's error for now so we know it's broken.
        return NextResponse.json({ error: "Failed to fetch price from all sources" }, { status: 502 });

    } catch (error) {
        console.error("[PriceProxy] Server error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
