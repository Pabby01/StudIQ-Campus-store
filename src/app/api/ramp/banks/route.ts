import { getBanks, resolveBankAccount } from 'paj_ramp';
import { PAJ_CONFIG } from '@/lib/paj';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        const bankId = searchParams.get('bankId');
        const accountNumber = searchParams.get('accountNumber');

        if (!token) {
            return NextResponse.json({ error: "Session token is required" }, { status: 401 });
        }

        if (bankId && accountNumber) {
            console.log(`[PAJ Ramp] Resolving bank account: ${accountNumber} in ${bankId}`);
            const account = await resolveBankAccount(token, bankId, accountNumber);
            return NextResponse.json({ success: true, account });
        }

        console.log("[PAJ Ramp] Fetching banks");
        const banks = await getBanks(token);
        return NextResponse.json({ success: true, banks });
    } catch (error: any) {
        console.error("[PAJ Ramp] Bank operation failed:", error);
        return NextResponse.json({
            error: error.message || "Bank operation failed"
        }, { status: 500 });
    }
}
