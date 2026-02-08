import { getAllRate, getRateByAmount } from 'paj_ramp';
import { NextResponse } from 'next/server';

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const mapMintForPaj = (mint: string) => {
    if (mint === DEVNET_USDC_MINT) return MAINNET_USDC_MINT;
    return mint;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const amount = searchParams.get('amount');
        let mint = searchParams.get('mint');

        if (amount && mint) {
            // Map devnet mint to mainnet for Paj pricing
            mint = mapMintForPaj(mint);
            const parsedAmount = parseFloat(amount);
            try {
                // Use public onramp rate for USD->NGN conversion to avoid session-token 401s
                const rates = await getAllRate();
                const ngnPerUsd = Number(rates?.onRampRate?.rate);
                if (ngnPerUsd && !Number.isNaN(ngnPerUsd)) {
                    return NextResponse.json({ success: true, tokenValue: { rate: ngnPerUsd * parsedAmount } });
                }
                const fallback = await getFallbackNgnPerUsd();
                if (fallback) {
                    return NextResponse.json({ success: true, tokenValue: { rate: fallback * parsedAmount } });
                }
                throw new Error("Failed to fetch rates");
            } catch {
                const fallback = await getFallbackNgnPerUsd();
                if (fallback) {
                    return NextResponse.json({ success: true, tokenValue: { rate: fallback * parsedAmount } });
                }
                throw new Error("Failed to fetch rates");
            }
        }

        if (amount) {
            const rate = await getRateByAmount(parseFloat(amount));
            return NextResponse.json({ success: true, rate });
        }

        const rates = await getAllRate();
        return NextResponse.json({ success: true, rates });
    } catch (error: unknown) {
        console.error("[PAJ Ramp] Failed to fetch rates:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Failed to fetch rates"
        }, { status: 500 });
    }
}

async function getFallbackNgnPerUsd() {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) return null;
        const data = await res.json();
        const rate = Number(data?.rates?.NGN);
        return rate && !Number.isNaN(rate) ? rate : null;
    } catch {
        return null;
    }
}
