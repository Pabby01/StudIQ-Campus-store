/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { getSessionWallet } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const address = await getSessionWallet(req);

        await requireAdmin(address);

        const body = await req.json();
        const code = body.reference;

        if (!code) {
            return Response.json(
                { ok: false, error: "Verification code is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        let identifier = code.trim();

        if (identifier.toUpperCase().startsWith("PAJ-")) {
            const parts = identifier.split("-");
            identifier = parts[parts.length - 1] || identifier;
        }

        let query = supabase
            .from("ramp_transactions")
            .select("*")
            .limit(1);

        if (identifier.length > 8) {
            query = query.eq("paj_id", identifier);
        } else {
            query = query.ilike("paj_id", `%${identifier}`);
        }

        const { data, error } = await query.single();

        if (error) {
            if (error.code === "PGRST116" || error.code === "PGRST204") {
                return Response.json(
                    { ok: false, error: "Transaction not found" },
                    { status: 404 }
                );
            }

            console.error("[Admin Paj Verify] DB error:", error);
            return Response.json(
                { ok: false, error: "Failed to lookup transaction" },
                { status: 500 }
            );
        }

        const transaction = {
            id: data.id,
            pajId: data.paj_id,
            userAddress: data.user_address,
            type: data.type,
            fiatAmount: typeof data.fiat_amount === "number" ? data.fiat_amount : parseFloat(data.fiat_amount || "0"),
            cryptoAmount: data.crypto_amount,
            currency: data.currency,
            status: data.status,
            mint: data.mint,
            txSignature: data.tx_signature,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };

        return Response.json({
            ok: true,
            data: transaction, // Changed from transaction to data: transaction to match frontend expectation
        });
    } catch (error: any) {
        console.error("[Admin Paj Verify] Error:", error);

        if (error?.message?.includes("Unauthorized")) {
            return Response.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
