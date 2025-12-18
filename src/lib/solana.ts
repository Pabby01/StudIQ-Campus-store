
import {
    address,
    appendTransactionMessageInstruction,
    compileTransaction,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    devnet,
    getSignatureFromTransaction,
    lamports,
    mainnet,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Transaction,
    UnixTimestamp,
    Signature,
    getProgramDerivedAddress,
    getBase64EncodedWireTransaction,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getTransferInstruction } from '@solana-program/token';
import { VersionedTransaction } from '@solana/web3.js';

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SOLANA_WSS_URL = SOLANA_RPC_URL.replace("http", "ws"); // Simple replacement for WSS

// Initialize connection
export const rpc = createSolanaRpc(SOLANA_RPC_URL);
export const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WSS_URL);

/**
 * Create a SOL or SPL Token transfer transaction
 */
export async function createTransferTransaction(
    from: string,
    to: string,
    amount: number,
    mint?: string // Optional mint address for SPL tokens
) {
    if (mint && mint !== "SOL") {
        return createSplTransferTransaction(from, to, amount, mint);
    }

    console.log("Creating SOL transaction:", { from, to, amount });

    if (amount > 100) {
        console.warn(`High SOL amount detected (${amount} SOL). Ensure this is intended.`);
    }

    const fromAddress = address(from);
    const toAddress = address(to);
    const amountLamports = lamports(BigInt(Math.floor(amount * 1_000_000_000)));

    console.log("Lamports:", amountLamports);

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create a transaction message
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayer(fromAddress, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstruction(
            getTransferSolInstruction({
                source: fromAddress as any, // TransactionSigner is required here, cast to any to allow Address 
                // The wallet adapter handles signing. We just need to construct the message.
                // In Framework Kit, for instruction creation, mostly Address is fine if not checking constraints rigidly
                // or we might need to cast or use a signer placeholder if strict typing demands it.
                // However, 'getTransferSolInstruction' source is constrained to TransactionSigner. 
                // We can treat it as such for *construction* purposes since we know it will sign.
                destination: toAddress,
                amount: amountLamports,
            }) as any, // Cast as any because we don't have the signer object yet, just address
            m
        )
    );

    // Compile the transaction
    const compiledTx = compileTransaction(transactionMessage);

    // Convert compiled transaction to VersionedTransaction for wallet compatibility
    // This ensures the transaction has a .serialize() method that wallets expect
    const base64Tx = getBase64EncodedWireTransaction(compiledTx) as string;
    const txBuffer = Buffer.from(base64Tx, 'base64');
    const versionedTx = VersionedTransaction.deserialize(txBuffer);

    return versionedTx;
}

export const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC
const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = address("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

async function getAssociatedTokenAddress(mint: string, owner: string) {
    const mintAddress = address(mint);
    const ownerAddress = address(owner);

    // Derive ATA: pda([owner, token_program, mint], associated_token_program)
    const { 0: ata } = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
        seeds: [
            ownerAddress,
            TOKEN_PROGRAM_ID,
            mintAddress,
        ],
    });

    return ata;
}

/**
 * Create a SPL Token transfer transaction
 */
export async function createSplTransferTransaction(
    from: string,
    to: string,
    amount: number,
    mint: string
) {
    console.log("Creating SPL transaction:", { from, to, amount, mint });

    const fromAddress = address(from);
    // const toAddress = address(to); // Used for ATA derivation
    const mintAddress = address(mint);

    // Calculate Amount (USDC has 6 decimals)
    const decimals = 6;
    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Get ATAs
    const fromAta = await getAssociatedTokenAddress(mint, from);
    const toAta = await getAssociatedTokenAddress(mint, to);

    console.log("ATAs:", { fromAta, toAta });

    // Create a transaction message
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayer(fromAddress, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstruction(
            getTransferInstruction({
                source: fromAta,
                destination: toAta,
                amount: amountBigInt,
                // authority: fromAddress, // Implicitly handled by wallet signing?
                // The wallet is the signer for the 'authority' of the source ATA.
                // In @solana-program/token, we might need to specify authority.
                // Let's check signatures if it fails, but usually source authority is required string/signer.
                authority: fromAddress as any,
            }) as any,
            m
        )
    );

    // Compile the transaction
    const compiledTx = compileTransaction(transactionMessage);

    // Convert compiled transaction to VersionedTransaction for wallet compatibility
    const base64Tx = getBase64EncodedWireTransaction(compiledTx) as string;
    const txBuffer = Buffer.from(base64Tx, 'base64');
    const versionedTx = VersionedTransaction.deserialize(txBuffer);

    return versionedTx;
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
        // Fetch transaction
        const transaction = await rpc.getTransaction(
            signature as Signature, // Cast string to Signature nominal type
            { maxSupportedTransactionVersion: 0, commitment: 'confirmed', encoding: 'jsonParsed' }
        ).send();

        if (!transaction) {
            return { valid: false, error: "Transaction not found" };
        }

        if (transaction.meta?.err) {
            return { valid: false, error: "Transaction failed or has errors" };
        }

        // Verify sender and recipient
        // @ts-ignore
        const accountKeys = transaction.transaction.message.accountKeys;
        const fromAccount = accountKeys[0];
        const toAccount = accountKeys[1];

        // accountKeys elements are objects with a 'pubkey' property (Address)
        const fromPubkey = fromAccount.pubkey ? fromAccount.pubkey : fromAccount;
        const toPubkey = toAccount.pubkey ? toAccount.pubkey : toAccount;

        // Ensure we compare strings
        if (fromPubkey.toString() !== expectedFrom) {
            return { valid: false, error: `Sender address mismatch. Expected ${expectedFrom}, got ${fromPubkey}` };
        }

        if (toPubkey.toString() !== expectedTo) {
            return { valid: false, error: "Recipient address mismatch" };
        }

        // Verify amount
        const preBalances = transaction.meta?.preBalances || [];
        const postBalances = transaction.meta?.postBalances || [];

        const preBal = preBalances[0];
        const postBal = postBalances[0];
        const fee = transaction.meta?.fee || 0;

        const transferredLamports = Number(preBal) - Number(postBal) - Number(fee);
        const expectedLamports = Math.floor(expectedAmount * 1_000_000_000);

        // Allow 1% tolerance
        const tolerance = expectedLamports * 0.01;
        if (Math.abs(transferredLamports - expectedLamports) > tolerance) {
            return {
                valid: false,
                error: `Amount mismatch. Expected: ${expectedAmount} SOL, Got: ${transferredLamports / 1_000_000_000} SOL`,
            };
        }

        return { valid: true, transaction };

    } catch (error) {
        console.error("Transaction verification error:", error);
        return {
            valid: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/**
 * Broadcast a signed transaction to the network
 */
export async function broadcastTransaction(signedTransaction: any) {
    try {
        // Framework Kit 'rpc.sendTransaction' takes a base64 string
        // The wallet adapter 'signTransaction' returns a compiled transaction object

        let base64Tx: string;

        if ('serialize' in signedTransaction && typeof signedTransaction.serialize === 'function') {
            // Legacy Transaction or VersionedTransaction from old wallet adapters
            const serialized = signedTransaction.serialize();
            base64Tx = Buffer.from(serialized).toString('base64');
        } else {
            // Framework Kit Transaction (compiled transaction object)
            // Use the helper to serialize it properly
            base64Tx = getBase64EncodedWireTransaction(signedTransaction) as string;
        }

        console.log("Broadcasting transaction...");

        // Send (cast to any to bypass Base64EncodedWireTransaction branded type)
        const signature = await rpc.sendTransaction(base64Tx as any, {
            encoding: 'base64',
            preflightCommitment: 'confirmed'
        }).send();

        console.log("Transaction sent:", signature);

        return signature;
    } catch (error) {
        console.error("Broadcast failed:", error);
        throw error;
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
        const { value: status } = await rpc.getSignatureStatuses([signature as Signature]).send();
        const s = status?.[0]; // getSignatureStatuses returns a list

        if (!s) {
            return { confirmed: false, finalized: false, error: "Transaction not found" };
        }

        return {
            confirmed: s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized',
            finalized: s.confirmationStatus === 'finalized',
            error: s.err ? String(s.err) : undefined,
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
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
    signature: string,
    timeoutMs: number = 60000
): Promise<boolean> {
    console.log("Waiting for confirmation:", signature);
    const startTime = Date.now();

    // Give the transaction some time to propagate before first check
    await new Promise((resolve) => setTimeout(resolve, 3000));

    while (Date.now() - startTime < timeoutMs) {
        const status = await getTransactionStatus(signature);

        // Only throw error if transaction actually failed, not if it's just not found yet
        if (status.error && status.error !== "Transaction not found") {
            throw new Error(status.error);
        }

        if (status.confirmed) {
            console.log("Transaction confirmed!");
            return true;
        }

        console.log("Transaction pending, checking again in 3 seconds...");
        // Wait 3 seconds between checks
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error("Transaction confirmation timeout");
}

export function solToLamports(sol: number): number {
    return Math.floor(sol * 1_000_000_000);
}

export function lamportsToSol(l: number | bigint): number {
    // Check if l is a Lamports type (which might be an object or bigint/number depending on version)
    // The previous error "property lamports does not exist on type Lamports" implies Lamports is likely just a bigint with a brand
    return Number(l) / 1_000_000_000;
}

export async function getBalance(addr: string): Promise<number> {
    const { value: balance } = await rpc.getBalance(address(addr)).send();
    // 'balance' is of type Lamports, which behaves like a bigint
    return lamportsToSol(balance);
}

export function isValidSolanaAddress(addr: string): boolean {
    try {
        address(addr);
        return true;
    } catch {
        return false;
    }
}
