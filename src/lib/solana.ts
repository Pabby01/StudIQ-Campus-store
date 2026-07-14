/* eslint-disable @typescript-eslint/no-unused-vars */

import {
    address,
    appendTransactionMessageInstruction,
    compileTransaction,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    lamports,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    getProgramDerivedAddress,
    getBase64EncodedWireTransaction,
    getAddressEncoder,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getTransferInstruction } from '@solana-program/token';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress as getSplAssociatedTokenAddress, createTransferInstruction as createSplTransferInstruction } from '@solana/spl-token';
import { SOLANA_CONFIG } from './solana-config';

const SOLANA_RPC_URL = SOLANA_CONFIG.rpcUrl;
const SOLANA_WSS_URL = SOLANA_RPC_URL.replace("http", "ws"); // Simple replacement for WSS

// Initialize connection
export const rpc = createSolanaRpc(SOLANA_RPC_URL);
export const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WSS_URL);

export function getClusterUrl(cluster: 'devnet' | 'mainnet') {
    if (cluster === 'mainnet' || SOLANA_CONFIG.network === 'mainnet') {
        const rpc = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || SOLANA_CONFIG.rpcUrl;
        if (!rpc || rpc.includes("api.mainnet-beta.solana.com")) {
            throw new Error("FATAL: Dedicated RPC URL required for mainnet. Public nodes prohibited.");
        }
        return rpc;
    }
    return process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
}

export function getRpc(cluster: 'devnet' | 'mainnet' = 'devnet') {
    return createSolanaRpc(getClusterUrl(cluster));
}

export function getRpcSubscriptions(cluster: 'devnet' | 'mainnet' = 'devnet') {
    return createSolanaRpcSubscriptions(getClusterUrl(cluster).replace("http", "ws"));
}

/**
 * Create a SOL or SPL Token transfer transaction
 */
export async function createTransferTransaction(
    from: string,
    to: string,
    amount: number,
    mint?: string, // Optional mint address for SPL tokens
    cluster: 'devnet' | 'mainnet' = SOLANA_CONFIG.network,
    decimals: number = 9 // Default to 9 for SOL
) {
    if (mint && mint !== "SOL") {
        return createSplTransferTransaction(from, to, amount, mint, decimals, cluster);
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
    const { value: latestBlockhash } = await getRpc(cluster).getLatestBlockhash().send();

    // Create a transaction message
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayer(fromAddress, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) =>
            appendTransactionMessageInstruction(
                getTransferSolInstruction({
                    source: fromAddress as unknown as Parameters<typeof getTransferSolInstruction>[0]["source"],
                    destination: toAddress,
                    amount: amountLamports,
                }) as ReturnType<typeof getTransferSolInstruction>,
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

export const USDC_MINT = SOLANA_CONFIG.usdcMint;

/**
 * Create a SPL Token transfer transaction
 */
export async function createSplTransferTransaction(
    from: string,
    to: string,
    amount: number,
    mint: string,
    decimals: number = 6,
    cluster: 'devnet' | 'mainnet' = SOLANA_CONFIG.network
) {
    console.log("Creating SPL transaction:", { from, to, amount, mint, decimals, cluster });

    const connection = new Connection(getClusterUrl(cluster), { commitment: "confirmed" });
    const fromAddress = new PublicKey(from);
    const toAddress = new PublicKey(to);
    const mintAddress = new PublicKey(mint);

    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    const fromAta = await getSplAssociatedTokenAddress(mintAddress, fromAddress);
    const toAta = await getSplAssociatedTokenAddress(mintAddress, toAddress);

    const [fromInfo, toInfo] = await Promise.all([
        connection.getAccountInfo(fromAta),
        connection.getAccountInfo(toAta),
    ]);

    if (!fromInfo) {
        throw new Error("Sender does not have a USDC account");
    }

    const instructions = [];

    if (!toInfo) {
        instructions.push(
            createAssociatedTokenAccountInstruction(
                fromAddress,
                toAta,
                toAddress,
                mintAddress
            )
        );
    }

    instructions.push(createSplTransferInstruction(fromAta, toAta, fromAddress, amountBigInt));

    const { blockhash } = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: fromAddress,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    return new VersionedTransaction(message);
}

/**
 * Verify a transaction on the Solana network
 */
export interface VerifiedTransactionInfo {
    valid: boolean;
    error?: string;
    // Shape from @solana/kit rpc getTransaction jsonParsed
    transaction?: {
        transaction: {
            message: {
                accountKeys: Array<{
                    pubkey?: string;
                    [key: string]: unknown;
                }>;
            };
        };
        meta?: {
            err?: unknown;
            preBalances?: Array<number | bigint>;
            postBalances?: Array<number | bigint>;
            fee?: number | bigint;
        };
        [key: string]: unknown;
    };
}

export async function verifySplTransferTransaction(
    signature: string,
    expectedFrom: string,
    expectedTo: string,
    mint: string,
    expectedAmount: number,
    tolerancePercent: number = 0.01
): Promise<VerifiedTransactionInfo> {
    try {
        const transaction = await rpc.getTransaction(
            signature as Signature,
            { maxSupportedTransactionVersion: 0, commitment: 'confirmed', encoding: 'jsonParsed' }
        ).send() as unknown as VerifiedTransactionInfo["transaction"];

        if (!transaction) {
            return { valid: false, error: "Transaction not found" };
        }

        if (transaction.meta?.err) {
            return { valid: false, error: "Transaction failed or has errors" };
        }

        type TokenBalance = {
            mint?: string;
            owner?: string;
            uiTokenAmount?: {
                uiAmount?: number | null;
                amount?: string;
                decimals?: number;
            };
        };

        const meta = transaction.meta as {
            preTokenBalances?: TokenBalance[];
            postTokenBalances?: TokenBalance[];
        } | undefined;

        const preTokenBalances = meta?.preTokenBalances || [];
        const postTokenBalances = meta?.postTokenBalances || [];

        const getUiAmount = (entry: TokenBalance) => {
            const ui = entry.uiTokenAmount;
            if (!ui) return 0;
            if (typeof ui.uiAmount === "number") return ui.uiAmount;
            const amount = Number(ui.amount || 0);
            const decimals = Number(ui.decimals || 0);
            return amount / Math.pow(10, decimals);
        };

        const sumByOwner = (balances: TokenBalance[], owner: string) =>
            balances
                .filter((b) => b.mint === mint && b.owner === owner)
                .reduce((sum, b) => sum + getUiAmount(b), 0);

        const preFrom = sumByOwner(preTokenBalances, expectedFrom);
        const postFrom = sumByOwner(postTokenBalances, expectedFrom);
        const preTo = sumByOwner(preTokenBalances, expectedTo);
        const postTo = sumByOwner(postTokenBalances, expectedTo);

        const sent = preFrom - postFrom;
        const received = postTo - preTo;

        const tolerance = expectedAmount * tolerancePercent;
        if (Math.abs(received - expectedAmount) > tolerance && Math.abs(sent - expectedAmount) > tolerance) {
            return {
                valid: false,
                error: `Amount mismatch. Expected: ${expectedAmount} ${mint}, Got: ${received}`,
            };
        }

        return { valid: true, transaction };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

export async function verifyTransaction(
    signature: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: number,
    tolerancePercent: number = 0.01 // Default to 1% tolerance
): Promise<VerifiedTransactionInfo> {
    try {
        // Fetch transaction
        const transaction = await rpc.getTransaction(
            signature as Signature, // Cast string to Signature nominal type
            { maxSupportedTransactionVersion: 0, commitment: 'confirmed', encoding: 'jsonParsed' }
        ).send() as unknown as VerifiedTransactionInfo["transaction"];

        if (!transaction) {
            return { valid: false, error: "Transaction not found" };
        }

        if (transaction.meta?.err) {
            return { valid: false, error: "Transaction failed or has errors" };
        }

        // Verify sender and recipient
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

        // Verify SOL amount (Note: SPL Token verification not yet implemented in this helper)
        const preBalances = transaction.meta?.preBalances || [];
        const postBalances = transaction.meta?.postBalances || [];

        const preBal = preBalances[0];
        const postBal = postBalances[0];
        const fee = transaction.meta?.fee || 0;

        const transferredLamports = Number(preBal) - Number(postBal) - Number(fee);
        const expectedLamports = Math.floor(expectedAmount * 1_000_000_000);

        // Allow configurable tolerance
        const tolerance = expectedLamports * tolerancePercent;
        if (Math.abs(transferredLamports - expectedLamports) > tolerance) {
            return {
                valid: false,
                error: `Amount mismatch. Expected: ${expectedAmount} SOL, Got: ${transferredLamports / 1_000_000_000} SOL`,
            };
        }

        return { valid: true, transaction };

    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/**
 * Broadcast a signed transaction to the network
 */
export type BroadcastableTransaction =
    | string
    | Buffer
    | Uint8Array
    | number[]
    | {
        serialize: () => Uint8Array;
        [key: string]: unknown;
    };

type SerializableTransaction = { serialize: () => Uint8Array };

function hasSerialize(tx: BroadcastableTransaction): tx is SerializableTransaction {
    return (
        typeof tx === "object" &&
        tx !== null &&
        "serialize" in tx &&
        typeof (tx as { serialize?: () => Uint8Array }).serialize === "function"
    );
}

export async function broadcastTransaction(signedTransaction: BroadcastableTransaction) {
    try {
        console.log("[Broadcast] Input type:", typeof signedTransaction);
        console.log("[Broadcast] Is array:", Array.isArray(signedTransaction));
        console.log("[Broadcast] Is Buffer:", Buffer.isBuffer(signedTransaction));

        // Framework Kit 'rpc.sendTransaction' takes a base64 string
        // The wallet adapter 'signTransaction' returns a compiled transaction object

        let base64Tx: string;

        // Handle different input types
        if (Array.isArray(signedTransaction)) {
            // Plain array (from JSON)
            console.log("[Broadcast] Converting array to base64");
            base64Tx = Buffer.from(signedTransaction).toString('base64');
        } else if (Buffer.isBuffer(signedTransaction)) {
            // Raw buffer (from serialize())
            console.log("[Broadcast] Converting Buffer to base64");
            base64Tx = signedTransaction.toString('base64');
        } else if (ArrayBuffer.isView(signedTransaction)) {
            // Uint8Array or other typed array
            console.log("[Broadcast] Converting typed array to base64");
            base64Tx = Buffer.from(signedTransaction as Uint8Array).toString('base64');
        } else if (typeof signedTransaction === 'string') {
            // Already base64
            console.log("[Broadcast] Already base64 string");
            base64Tx = signedTransaction;
        } else if (hasSerialize(signedTransaction)) {
            // Legacy Transaction or VersionedTransaction from old wallet adapters
            console.log("[Broadcast] Serializing transaction object");
            const serialized = signedTransaction.serialize();
            base64Tx = Buffer.from(serialized).toString('base64');
        } else {
            // Framework Kit Transaction (compiled transaction object)
            // Use the helper to serialize it properly
            console.log("[Broadcast] Using getBase64EncodedWireTransaction");
            base64Tx = getBase64EncodedWireTransaction(
                signedTransaction as unknown as Parameters<typeof getBase64EncodedWireTransaction>[0]
            ) as string;
        }

        console.log("[Broadcast] Broadcasting transaction...");
        console.log("[Broadcast] Base64 length:", base64Tx.length);

        // Send (cast via unknown to bypass Base64EncodedWireTransaction branded type)
        const signature = await rpc.sendTransaction(base64Tx as unknown as Parameters<(typeof rpc)["sendTransaction"]>[0], {
            encoding: 'base64',
            preflightCommitment: 'confirmed'
        }).send();

        console.log("[Broadcast] Transaction sent:", signature);

        return signature;
    } catch (error) {
        console.error("[Broadcast] Broadcast failed:", error);
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
