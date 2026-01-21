import {
    createTransferTransaction,
    createSplTransferTransaction,
    broadcastTransaction,
    waitForConfirmation,
    getRpc,
} from "@/lib/solana";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

interface SwapTransactionParams {
    userAddress: string;
    fromToken: "SOL" | "USDC";
    toToken: "SOL" | "USDC";
    fromAmount: number;
    toAmount: number;
    feeAmount: number;
    cluster: "devnet" | "mainnet";
}

/**
 * Creates and executes a swap transaction
 * 
 * Flow:
 * 1. User sends fromAmount to platform wallet
 * 2. Platform sends (toAmount - fee) to user
 * 3. Platform keeps the fee
 */
export async function executeSwapTransaction(
    params: SwapTransactionParams,
    userSignTransaction: (tx: any) => Promise<any>
): Promise<{ signature: string; platformSignature: string }> {
    const {
        userAddress,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        feeAmount,
        cluster,
    } = params;

    const platformWallet = SOLANA_CONFIG.platformWallet;
    const platformPrivateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY!;

    if (!platformPrivateKey) {
        throw new Error("Platform wallet private key not configured");
    }

    // Decode platform wallet keypair
    const platformKeypair = Keypair.fromSecretKey(bs58.decode(platformPrivateKey));

    // Step 1: User sends fromAmount to platform
    console.log(`[Swap] Creating user -> platform transaction: ${fromAmount} ${fromToken}`);

    let userToPlatformTx;
    if (fromToken === "SOL") {
        userToPlatformTx = await createTransferTransaction(
            userAddress,
            platformWallet,
            fromAmount,
            undefined,
            cluster
        );
    } else {
        // USDC transfer
        userToPlatformTx = await createSplTransferTransaction(
            userAddress,
            platformWallet,
            fromAmount,
            SOLANA_CONFIG.usdcMint
        );
    }

    // User signs their transaction
    console.log("[Swap] Requesting user signature...");
    const signedUserTx = await userSignTransaction(userToPlatformTx);

    // Broadcast user transaction
    console.log("[Swap] Broadcasting user transaction...");
    const userSignature = await broadcastTransaction(signedUserTx);

    // Wait for user transaction confirmation
    console.log("[Swap] Waiting for user transaction confirmation...");
    await waitForConfirmation(userSignature, 60000);

    // Step 2: Platform sends (toAmount - fee) to user
    const netToAmount = toAmount - feeAmount;
    console.log(`[Swap] Creating platform -> user transaction: ${netToAmount} ${toToken}`);

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
            SOLANA_CONFIG.usdcMint
        );
    }

    // Platform signs their transaction
    console.log("[Swap] Platform signing transaction...");
    // Note: For VersionedTransaction, we need to sign differently
    // The platformKeypair needs to be added as a signer
    // Since our createTransferTransaction returns a VersionedTransaction,
    // we need to sign it properly

    // For now, we'll use a simpler approach: serialize, sign, deserialize
    const serialized = platformToUserTx.serialize();
    platformToUserTx.sign([platformKeypair]);

    // Broadcast platform transaction
    console.log("[Swap] Broadcasting platform transaction...");
    const platformSignature = await broadcastTransaction(platformToUserTx);

    // Wait for platform transaction confirmation
    console.log("[Swap] Waiting for platform transaction confirmation...");
    await waitForConfirmation(platformSignature, 60000);

    console.log("[Swap] Swap completed successfully!");
    console.log(`  User -> Platform: ${userSignature}`);
    console.log(`  Platform -> User: ${platformSignature}`);
    console.log(`  Fee collected: ${feeAmount} ${toToken}`);

    return {
        signature: userSignature,
        platformSignature,
    };
}
