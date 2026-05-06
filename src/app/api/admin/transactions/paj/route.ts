import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("paj_transactions")
      .select("*, profiles(name, phone)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedTransactions = (transactions || []).map((tx: any) => ({
      id: tx.id,
      userId: tx.user_address,
      userName: tx.profiles?.name || "Unknown",
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at,
      reference_id: tx.reference_id,
    }));

    // Calculate stats
    const { data: allTransactions } = await supabase
      .from("paj_transactions")
      .select("amount, status");

    const totalTransactions = allTransactions?.length || 0;
    const completedTransactions = (allTransactions || []).filter(
      (t) => t.status === "completed"
    ).length;
    const pendingTransactions = (allTransactions || []).filter(
      (t) => t.status === "pending"
    ).length;
    const failedTransactions = (allTransactions || []).filter(
      (t) => t.status === "failed"
    ).length;

    return NextResponse.json({
      transactions: formattedTransactions,
      total: count || 0,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
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
