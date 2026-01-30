 
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

let cachedPrice: number | null = null;
let cachedAt = 0;
let inFlight: Promise<number> | null = null;

async function fetchSolPriceInternal() {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
        headers: {
            Accept: "application/json",
            "User-Agent": "CampusStore/1.0"
        },
        next: { revalidate: 60 }
    });

    if (!res.ok) {
        throw new Error(`CoinGecko error: ${res.status}`);
    }

    const data = await res.json();
    const price = Number(data.solana?.usd);
    if (!price || Number.isNaN(price)) {
        throw new Error("Invalid price from CoinGecko");
    }
    return price;
}

export async function GET() {
    try {
        const now = Date.now();

        if (cachedPrice && now - cachedAt < 60000) {
            return NextResponse.json({ price: cachedPrice, source: "cache" });
        }

        if (!inFlight) {
            inFlight = fetchSolPriceInternal()
                .then((price) => {
                    cachedPrice = price;
                    cachedAt = Date.now();
                    return price;
                })
                .finally(() => {
                    inFlight = null;
                });
        }

        const price = await inFlight;
        return NextResponse.json({ price, source: "coingecko" });
    } catch (error) {
        console.error("[PriceProxy] Server error details:", error);
        if (cachedPrice) {
            return NextResponse.json({ price: cachedPrice, source: "cache" });
        }
        return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
    }
}
