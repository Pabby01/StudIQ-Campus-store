import { getAllRate, getRateByAmount, getTokenValue, Currency } from 'paj_ramp';
import { PAJ_CONFIG } from '@/lib/paj';
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

            const tokenValue = await getTokenValue({
                amount: parseFloat(amount),
                mint,
                currency: Currency.NGN
            }, PAJ_CONFIG.apiKey);
            return NextResponse.json({ success: true, tokenValue });
        }

        if (amount) {
            const rate = await getRateByAmount(parseFloat(amount));
            return NextResponse.json({ success: true, rate });
        }

        const rates = await getAllRate();
        return NextResponse.json({ success: true, rates });
    } catch (error: any) {
        console.error("[PAJ Ramp] Failed to fetch rates:", error);
        return NextResponse.json({
            error: error.message || "Failed to fetch rates"
        }, { status: 500 });
    }
}
