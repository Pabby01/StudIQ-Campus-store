import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PLATFORM_FEE_PERCENT = 2;
const MIN_SWAP_USD = 1;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            walletAddress,
            fromToken,
            toToken,
            amount,
            cluster,
            userSignature,
            platformSignature,
        } = body;

        if (!walletAddress || !fromToken || !toToken || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Fetch current SOL price
        const priceRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/price/sol`
        );
        if (!priceRes.ok) {
            return NextResponse.json(
                { error: "Failed to fetch exchange rate" },
                { status: 500 }
            );
        }

        const { price: solPrice } = await priceRes.json();

        // Calculate swap amounts
        let usdValue = 0;
        let outputBeforeFee = 0;

        if (fromToken === "SOL") {
            // SOL -> USDC
            usdValue = amount * solPrice;
            outputBeforeFee = usdValue;
        } else {
            // USDC -> SOL
            usdValue = amount;
            outputBeforeFee = amount / solPrice;
        }

        // Validate minimum
        if (usdValue < MIN_SWAP_USD) {
            return NextResponse.json(
                { error: `Minimum swap amount is $${MIN_SWAP_USD}` },
                { status: 400 }
            );
        }

        // Calculate fee and final output
        const feeAmount = outputBeforeFee * (PLATFORM_FEE_PERCENT / 100);
        const outputAmount = outputBeforeFee - feeAmount;

        // Check platform wallet liquidity
        try {
            const balanceRes = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/swap/platform-balance?cluster=${cluster}`
            );

            if (balanceRes.ok) {
                const { balances } = await balanceRes.json();
                const requiredBalance = outputAmount;
                const availableBalance = toToken === "SOL" ? balances.SOL : balances.USDC;

                if (availableBalance < requiredBalance) {
                    return NextResponse.json(
                        {
                            error: `Insufficient platform liquidity. Required: ${requiredBalance.toFixed(4)} ${toToken}, Available: ${availableBalance.toFixed(4)} ${toToken}. Please contact support.`,
                            code: "INSUFFICIENT_LIQUIDITY"
                        },
                        { status: 400 }
                    );
                }
            }
        } catch (error) {
            console.warn("[Swap Execute] Failed to check platform balance:", error);
            // Continue anyway - don't block swaps if balance check fails
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Record swap transaction in database
        const { data: swapRecord, error: swapError } = await supabase
            .from("swap_transactions")
            .insert({
                user_address: walletAddress,
                from_token: fromToken,
                to_token: toToken,
                from_amount: amount,
                to_amount: outputAmount,
                fee_amount: feeAmount,
                fee_percent: PLATFORM_FEE_PERCENT,
                exchange_rate: solPrice,
                usd_value: usdValue,
                cluster,
                status: userSignature && platformSignature ? "completed" : "pending",
                tx_signature: userSignature || null,
            })
            .select()
            .single();

        if (swapError) {
            console.error("Swap record error:", swapError);
            return NextResponse.json(
                { error: "Failed to record swap transaction" },
                { status: 500 }
            );
        }

        // Return swap details for client to execute
        return NextResponse.json({
            success: true,
            swap: {
                id: swapRecord.id,
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: outputAmount,
                feeAmount,
                exchangeRate: solPrice,
                usdValue,
            },
        });
    } catch (error) {
        console.error("Swap execution error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
