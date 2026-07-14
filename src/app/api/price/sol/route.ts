import { NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

export const dynamic = 'force-dynamic';
const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

export async function GET() {
    try {
        if (redis) {
            const cachedPrice = await redis.get("price:sol_usd");
            if (cachedPrice) {
                return NextResponse.json({ price: Number(cachedPrice), source: "redis-cache" });
            }
        }

        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
            headers: { Accept: "application/json" }
        });

        if (!res.ok) throw new Error("CoinGecko API Error");
        const data = await res.json();
        
        const price = Number(data?.solana?.usd);
        
        if (price) {
            if (redis) await redis.set("price:sol_usd", price, { ex: 30 }); // 30 second TTL
            return NextResponse.json({ price, source: "jupiter-api" });
        }
        
        throw new Error("Invalid price returned");
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
    }
}
