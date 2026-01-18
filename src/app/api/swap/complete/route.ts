import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    createTransferTransaction,
    createSplTransferTransaction,
    broadcastTransaction,
    waitForConfirmation,
} from "@/lib/solana";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { swapId, userSignedTx } = body;

        if (!swapId || !userSignedTx) {
            return NextResponse.json(
                { error: "Missing swap ID or signed transaction" },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get swap details
        const { data: swap, error: swapError } = await supabase
            .from("swap_transactions")
            .select("*")
            .eq("id", swapId)
            .single();

        if (swapError || !swap) {
            return NextResponse.json({ error: "Swap not found" }, { status: 404 });
        }

        if (swap.status !== "pending") {
            return NextResponse.json(
                { error: "Swap already processed" },
                { status: 400 }
            );
        }

        // Broadcast user transaction
        console.log("[Swap Complete] Broadcasting user transaction...");
        const userSignature = await broadcastTransaction(userSignedTx);

        // Wait for confirmation
        console.log("[Swap Complete] Waiting for user transaction confirmation...");
        await waitForConfirmation(userSignature, 60000);

        // Update swap with user signature
        await supabase
            .from("swap_transactions")
            .update({ tx_signature: userSignature })
            .eq("id", swapId);

        // Platform sends tokens back to user
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET!;
        const platformPrivateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY!;

        if (!platformPrivateKey) {
            throw new Error("Platform wallet private key not configured");
        }

        const platformKeypair = Keypair.fromSecretKey(
            bs58.decode(platformPrivateKey)
        );

        const netToAmount = swap.to_amount;
        const toToken = swap.to_token;
        const userAddress = swap.user_address;
        const cluster = swap.cluster as "devnet" | "mainnet";

        console.log(
            `[Swap Complete] Creating platform -> user transaction: ${netToAmount} ${toToken}`
        );

        let platformToUserTx;
        if (toToken === "SOL") {
            platformToUserTx = await createTransferTransaction(
                platformWallet,
                userAddress,
                netToAmount,
                undefined,
                cluster
            );
        } else {
            // USDC transfer
            platformToUserTx = await createSplTransferTransaction(
                platformWallet,
                userAddress,
                netToAmount,
                process.env.NEXT_PUBLIC_USDC_MINT ||
                "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
            );
        }

        // Platform signs transaction
        console.log("[Swap Complete] Platform signing transaction...");
        platformToUserTx.sign([platformKeypair]);

        // Broadcast platform transaction
        console.log("[Swap Complete] Broadcasting platform transaction...");
        const platformSignature = await broadcastTransaction(platformToUserTx);

        // Wait for confirmation
        console.log(
            "[Swap Complete] Waiting for platform transaction confirmation..."
        );
        await waitForConfirmation(platformSignature, 60000);

        // Update swap status to completed
        await supabase
            .from("swap_transactions")
            .update({
                status: "completed",
                updated_at: new Date().toISOString(),
            })
            .eq("id", swapId);

        // Notify user
        try {
            const { triggerNotification } = await import('@/lib/notifications');
            await triggerNotification({
                user_id: swap.user_address,
                title: 'Token Swap Successful! 🔄',
                message: `Your swap of ${swap.from_amount} ${swap.from_token} for ${swap.to_amount} ${swap.to_token} is complete.`,
                type: 'success',
                url: '/dashboard/wallet'
            });
        } catch (notifErr) {
            console.error("[Swap Complete] Notification failed:", notifErr);
        }

        console.log("[Swap Complete] Swap completed successfully!");
        console.log(`  User -> Platform: ${userSignature}`);
        console.log(`  Platform -> User: ${platformSignature}`);
        console.log(`  Fee collected: ${swap.fee_amount} ${toToken}`);

        return NextResponse.json({
            success: true,
            userSignature,
            platformSignature,
        });
    } catch (error) {
        console.error("Swap completion error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Swap failed" },
            { status: 500 }
        );
    }
}
