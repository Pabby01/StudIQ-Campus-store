import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PLATFORM_WALLET, convertUSDtoSOL, SUBSCRIPTION_PLANS, type PlanName, type BillingCycle } from "@/lib/pricing";

// POST /api/subscription/create-transaction - Create payment transaction
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { plan, cycle, userAddress } = body;

        if (!userAddress || !plan || !cycle) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const planDetails = SUBSCRIPTION_PLANS[plan as PlanName];
        if (!planDetails) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        const usdPrice = planDetails[cycle as BillingCycle];
        const solPrice = convertUSDtoSOL(usdPrice);

        // Create transaction
        const connection = new Connection(
            process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
                ? 'https://api.mainnet-beta.solana.com'
                : 'https://api.devnet.solana.com'
        );

        const platformWallet = new PublicKey(PLATFORM_WALLET);
        const userPublicKey = new PublicKey(userAddress);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: platformWallet,
                lamports: Math.floor(solPrice * LAMPORTS_PER_SOL)
            })
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPublicKey;

        // Serialize transaction
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        return NextResponse.json({
            success: true,
            transaction: Buffer.from(serializedTransaction).toString('base64')
        });
    } catch (error) {
        console.error("Transaction creation error:", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
