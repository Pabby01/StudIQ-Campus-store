import { Connection } from "@solana/web3.js";

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
// Fallback to standard request if Helius key is missing, but DAS API requires Helius or compatible RPC
const isHelius = HELIUS_RPC_URL?.includes("helius");

export interface HeliusAsset {
    id: string;
    content: {
        json_uri: string;
        files: { uri: string; mime: string }[];
        metadata: {
            name: string;
            symbol: string;
            token_standard: string;
        };
        links: { image: string };
    };
    token_info: {
        balance: number;
        supply: number;
        decimals: number;
        token_program: string;
        mint_authority: string;
        price_info?: {
            price_per_token: number;
            total_price: number;
            currency: string;
        };
    };
}

export interface HeliusAssetResponse {
    result: {
        total: number;
        limit: number;
        page: number;
        items: HeliusAsset[];
    };
}

/**
 * Fetch all assets (tokens) for an owner using Helius DAS API
 * This is much faster than standard getParsedTokenAccountsByOwner
 */
export async function getAssetsByOwner(ownerAddress: string): Promise<HeliusAsset[]> {
    if (!isHelius || !HELIUS_RPC_URL) {
        console.warn("[Helius] DAS API requires a Helius RPC URL. Fallback needed.");
        return [];
    }

    try {
        const response = await fetch(HELIUS_RPC_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "my-id",
                method: "getAssetsByOwner",
                params: {
                    ownerAddress,
                    page: 1, // Pagination might be needed for wallets with > 1000 tokens
                    limit: 1000,
                    displayOptions: {
                        showFungible: true, // Show tokens
                        showNativeBalance: true, // Show SOL
                    },
                },
            }),
        });

        const { result } = await response.json() as HeliusAssetResponse;

        if (!result || !result.items) {
            return [];
        }

        return result.items;
    } catch (error) {
        console.error("[Helius] Failed to fetch assets:", error);
        return [];
    }
}
