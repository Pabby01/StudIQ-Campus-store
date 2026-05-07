import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeStatus(status: string | null | undefined): "completed" | "pending" | "failed" {
  const value = (status || "").toLowerCase();
  if (value.includes("complete") || value.includes("success") || value.includes("paid")) {
    return "completed";
  }
  if (value.includes("fail") || value.includes("error") || value.includes("cancel") || value.includes("reject")) {
    return "failed";
  }
  return "pending";
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const flow = searchParams.get("flow") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: rampRows, error } = await supabase
      .from("ramp_transactions")
      .select("id, paj_id, user_address, type, fiat_amount, crypto_amount, currency, mint, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userAddresses = new Set<string>();
    (rampRows || []).forEach((tx: any) => userAddresses.add(tx.user_address));

    let profileMap = new Map<string, { name: string | null; email: string | null }>();
    if (userAddresses.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("address, name, email")
        .in("address", Array.from(userAddresses));

      profileMap = new Map<string, { name: string | null; email: string | null }>();
      (profiles || []).forEach((p: any) => {
        profileMap.set(p.address, { name: p.name, email: p.email });
      });
    }

    const movementTransactions = (rampRows || []).map((tx: any) => {
      const transactionType: "onramp" | "offramp" = tx.type === "offramp" ? "offramp" : "onramp";
      const fiatCurrency = tx.currency || "NGN";
      const cryptoCurrency = "USDC";

      const fromCurrency = transactionType === "onramp" ? fiatCurrency : cryptoCurrency;
      const toCurrency = transactionType === "onramp" ? cryptoCurrency : fiatCurrency;
      const fromAmount = transactionType === "onramp" ? Number(tx.fiat_amount || 0) : Number(tx.crypto_amount || 0);
      const toAmount = transactionType === "onramp" ? Number(tx.crypto_amount || 0) : Number(tx.fiat_amount || 0);

      return {
        id: tx.id,
        userId: tx.user_address,
        userName: profileMap.get(tx.user_address)?.name || "Unknown",
        userEmail: profileMap.get(tx.user_address)?.email || null,
        type: transactionType,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        fiatAmount: Number(tx.fiat_amount || 0),
        cryptoAmount: Number(tx.crypto_amount || 0),
        amount: Number(tx.fiat_amount || 0),
        status: normalizeStatus(tx.status),
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        reference_id: tx.paj_id,
        mint: tx.mint,
        source: "ramp_transactions",
      };
    });

    const flowFiltered =
      flow === "all"
        ? movementTransactions
        : movementTransactions.filter((tx) => tx.type === flow);

    const statusFiltered =
      status === "all"
        ? flowFiltered
        : flowFiltered.filter((tx) => tx.status === status);

    const offset = (page - 1) * limit;
    const pagedTransactions = statusFiltered.slice(offset, offset + limit);

    const totalTransactions = movementTransactions.length;
    const completedTransactions = movementTransactions.filter((t) => t.status === "completed").length;
    const pendingTransactions = movementTransactions.filter((t) => t.status === "pending").length;
    const failedTransactions = movementTransactions.filter((t) => t.status === "failed").length;

    const typeBreakdown = {
      onramp: movementTransactions.filter((t) => t.type === "onramp").length,
      offramp: movementTransactions.filter((t) => t.type === "offramp").length,
    };

    const sourceBreakdown = {
      pajTransactions: 0,
      rampTransactions: movementTransactions.length,
      subscriptionTransactions: 0,
    };

    return NextResponse.json({
      transactions: pagedTransactions,
      total: statusFiltered.length,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      typeBreakdown,
      sourceBreakdown,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching PAJ transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
