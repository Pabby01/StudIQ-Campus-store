import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    TransactionSignature,
} from "@solana/web3.js";

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";

// Initialize connection
export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

/**
 * Create a SOL transfer transaction
 */
export async function createTransferTransaction(
    from: string,
    to: string,
    amount: number
): Promise<Transaction> {
    const fromPubkey = new PublicKey(from);
    const toPubkey = new PublicKey(to);
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
        })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
}

/**
 * Verify a transaction on the Solana network
 */
export async function verifyTransaction(
    signature: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: number
): Promise<{
    valid: boolean;
    error?: string;
    transaction?: any;
}> {
    try {
        // Get transaction details
        const tx = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            return { valid: false, error: "Transaction not found" };
        }

        if (!tx.meta || tx.meta.err) {
            return { valid: false, error: "Transaction failed or has errors" };
        }

        // Verify transaction is confirmed
        const status = await connection.getSignatureStatus(signature);
        if (!status.value?.confirmationStatus || status.value.confirmationStatus === "processed") {
            return { valid: false, error: "Transaction not confirmed yet" };
        }

        // Verify sender and recipient
        const accountKeys = tx.transaction.message.getAccountKeys();
        const fromPubkey = accountKeys.get(0)?.toString();
        const toPubkey = accountKeys.get(1)?.toString();

        if (fromPubkey !== expectedFrom) {
            return { valid: false, error: "Sender address mismatch" };
        }

        if (toPubkey !== expectedTo) {
            return { valid: false, error: "Recipient address mismatch" };
        }

        // Verify amount (check post balances)
        const preBalances = tx.meta.preBalances;
        const postBalances = tx.meta.postBalances;
        const transferredLamports = preBalances[0] - postBalances[0] - (tx.meta.fee || 0);
        const expectedLamports = Math.floor(expectedAmount * LAMPORTS_PER_SOL);

        // Allow 1% tolerance for fees
        const tolerance = expectedLamports * 0.01;
        if (Math.abs(transferredLamports - expectedLamports) > tolerance) {
            return {
                valid: false,
                error: `Amount mismatch. Expected: ${expectedAmount} SOL, Got: ${transferredLamports / LAMPORTS_PER_SOL
                    } SOL`,
            };
        }

        return { valid: true, transaction: tx };
    } catch (error) {
        console.error("Transaction verification error:", error);
        return {
            valid: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string): Promise<{
    confirmed: boolean;
    finalized: boolean;
    error?: string;
}> {
    try {
        const status = await connection.getSignatureStatus(signature);

        if (!status.value) {
            return { confirmed: false, finalized: false, error: "Transaction not found" };
        }

        return {
            confirmed: status.value.confirmationStatus !== "processed",
            finalized: status.value.confirmationStatus === "finalized",
            error: status.value.err ? String(status.value.err) : undefined,
        };
    } catch (error) {
        return {
            confirmed: false,
            finalized: false,
            error: error instanceof Error ? error.message : "Status check failed",
        };
    }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
    signature: string,
    timeoutMs: number = 60000
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const status = await getTransactionStatus(signature);

        if (status.error) {
            throw new Error(status.error);
        }

        if (status.confirmed) {
            return true;
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Transaction confirmation timeout");
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
}

/**
 * Get account balance
 */
export async function getBalance(address: string): Promise<number> {
    const pubkey = new PublicKey(address);
    const balance = await connection.getBalance(pubkey);
    return lamportsToSol(balance);
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}
