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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const [pajResult, rampResult, subscriptionResult] = await Promise.all([
      supabase
        .from("paj_transactions")
        .select("id, user_address, amount, status, reference_id, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("ramp_transactions")
        .select("id, paj_id, user_address, fiat_amount, status, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscription_transactions")
        .select("id, user_address, amount, status, tx_signature, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (pajResult.error && pajResult.error.code !== "42P01") {
      throw pajResult.error;
    }
    if (rampResult.error && rampResult.error.code !== "42P01") {
      throw rampResult.error;
    }
    if (subscriptionResult.error && subscriptionResult.error.code !== "42P01") {
      throw subscriptionResult.error;
    }

    const pajRows = pajResult.data || [];
    const rampRows = rampResult.data || [];
    const subscriptionRows = subscriptionResult.data || [];

    const userAddresses = new Set<string>();
    pajRows.forEach((tx: any) => userAddresses.add(tx.user_address));
    rampRows.forEach((tx: any) => userAddresses.add(tx.user_address));
    subscriptionRows.forEach((tx: any) => userAddresses.add(tx.user_address));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("address, name, email")
      .in("address", Array.from(userAddresses));

    const profileMap = new Map<string, { name: string | null; email: string | null }>();
    (profiles || []).forEach((p: any) => {
      profileMap.set(p.address, { name: p.name, email: p.email });
    });

    const mergedTransactions = [
      ...pajRows.map((tx: any) => ({
        id: tx.id,
        userId: tx.user_address,
        userName: profileMap.get(tx.user_address)?.name || "Unknown",
        userEmail: profileMap.get(tx.user_address)?.email || null,
        amount: Number(tx.amount || 0),
        status: normalizeStatus(tx.status),
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        reference_id: tx.reference_id,
        source: "paj_transactions",
      })),
      ...rampRows.map((tx: any) => ({
        id: tx.id,
        userId: tx.user_address,
        userName: profileMap.get(tx.user_address)?.name || "Unknown",
        userEmail: profileMap.get(tx.user_address)?.email || null,
        amount: Number(tx.fiat_amount || 0),
        status: normalizeStatus(tx.status),
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        reference_id: tx.paj_id,
        source: "ramp_transactions",
      })),
      ...subscriptionRows.map((tx: any) => ({
        id: tx.id,
        userId: tx.user_address,
        userName: profileMap.get(tx.user_address)?.name || "Unknown",
        userEmail: profileMap.get(tx.user_address)?.email || null,
        amount: Number(tx.amount || 0),
        status: normalizeStatus(tx.status),
        createdAt: tx.created_at,
        updatedAt: tx.created_at,
        reference_id: tx.tx_signature,
        source: "subscription_transactions",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const statusFiltered =
      status === "all"
        ? mergedTransactions
        : mergedTransactions.filter((tx) => tx.status === status);

    const offset = (page - 1) * limit;
    const pagedTransactions = statusFiltered.slice(offset, offset + limit);

    const totalTransactions = mergedTransactions.length;
    const completedTransactions = mergedTransactions.filter((t) => t.status === "completed").length;
    const pendingTransactions = mergedTransactions.filter((t) => t.status === "pending").length;
    const failedTransactions = mergedTransactions.filter((t) => t.status === "failed").length;
    const sourceBreakdown = {
      pajTransactions: mergedTransactions.filter((t) => t.source === "paj_transactions").length,
      rampTransactions: mergedTransactions.filter((t) => t.source === "ramp_transactions").length,
      subscriptionTransactions: mergedTransactions.filter((t) => t.source === "subscription_transactions").length,
    };

    return NextResponse.json({
      transactions: pagedTransactions,
      total: statusFiltered.length,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
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
