import { NextResponse } from "next/server";
import { getBalance } from "@/lib/solana";
import { Connection, PublicKey } from "@solana/web3.js";

const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cluster = (searchParams.get("cluster") || "devnet") as "devnet" | "mainnet";

        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
        if (!platformWallet) {
            return NextResponse.json(
                { error: "Platform wallet not configured" },
                { status: 500 }
            );
        }

        // Get SOL balance
        const solBalance = await getBalance(platformWallet);

        // Get USDC balance
        let usdcBalance = 0;
        try {
            const rpcUrl = cluster === "mainnet"
                ? process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com"
                : process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

            const connection = new Connection(rpcUrl);
            const walletPubkey = new PublicKey(platformWallet);
            const mintPubkey = new PublicKey(USDC_MINT);

            // Get token accounts
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                walletPubkey,
                { mint: mintPubkey }
            );

            if (tokenAccounts.value.length > 0) {
                const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
                usdcBalance = accountInfo.tokenAmount.uiAmount || 0;
            }
        } catch (error) {
            console.error("[Platform Balance] Failed to fetch USDC balance:", error);
            // Don't fail the request, just return 0
        }

        return NextResponse.json({
            success: true,
            balances: {
                SOL: solBalance,
                USDC: usdcBalance,
            },
            cluster,
        });
    } catch (error) {
        console.error("[Platform Balance] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch platform balances" },
            { status: 500 }
        );
    }
}
