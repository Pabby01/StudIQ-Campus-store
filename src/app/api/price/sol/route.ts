import { NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

export const dynamic = 'force-dynamic';
const redis = Redis.fromEnv();

export async function GET() {
    try {
        const cachedPrice = await redis.get("price:sol_usd");
        if (cachedPrice) {
            return NextResponse.json({ price: Number(cachedPrice), source: "redis-cache" });
        }

        const res = await fetch("https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112", {
            headers: { Accept: "application/json" }
        });

        if (!res.ok) throw new Error("Jupiter API Error");
        const data = await res.json();
        
        const price = Number(data.data["So11111111111111111111111111111111111111112"]?.price);
        
        if (price) {
            await redis.set("price:sol_usd", price, { ex: 30 }); // 30 second TTL
            return NextResponse.json({ price, source: "jupiter-api" });
        }
        
        throw new Error("Invalid price returned");
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
    }
}
