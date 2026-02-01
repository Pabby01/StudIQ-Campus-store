/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { resolveBankAccount } from "paj_ramp";
import { PAJ_CONFIG } from "@/lib/paj";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const token: string | undefined = body.token;
        const bankId: string | undefined = body.bankId;
        const accountNumber: string | undefined = body.accountNumber;

        if (!token) {
            return NextResponse.json({ error: "Session token is required" }, { status: 401 });
        }

        if (!bankId || !accountNumber) {
            return NextResponse.json(
                { error: "Bank ID and account number are required" },
                { status: 400 }
            );
        }

        console.log(
            "[PAJ Ramp] Resolving account via POST:",
            {
                bankId,
                accountNumber,
                tokenPreview: token.slice(0, 8),
                webhook: PAJ_CONFIG.webhookUrl,
            }
        );

        const account = await resolveBankAccount(token, bankId, accountNumber);

        return NextResponse.json({
            success: true,
            account,
        });
    } catch (error: any) {
        console.error("[PAJ Ramp] Account resolution failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to resolve bank account" },
            { status: 500 }
        );
    }
}

