import { getAllRate, getRateByAmount, getTokenValue, Currency } from 'paj_ramp';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const amount = searchParams.get('amount');
        const mint = searchParams.get('mint');

        if (amount && mint) {
            const tokenValue = await getTokenValue({
                amount: parseFloat(amount),
                mint,
                currency: Currency.NGN // Defaulting to NGN for now as per app context
            }, "placeholder-session"); // The SDK seems to require a session token
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
