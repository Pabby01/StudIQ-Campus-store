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
    const limit = 50;

    let query = supabase
      .from("paj_transactions")
      .select("*, profiles:user_address(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Get statistics
    let statsQuery = supabase.from("paj_transactions").select("status", { count: "exact" });

    const { data: allTxns } = await supabase.from("paj_transactions").select("*");

    const totalTransactions = allTxns?.length || 0;
    const completedTransactions = allTxns?.filter((t) => t.status === "completed").length || 0;
    const pendingTransactions = allTxns?.filter((t) => t.status === "pending").length || 0;
    const failedTransactions = allTxns?.filter((t) => t.status === "failed").length || 0;

    return NextResponse.json({
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      transactions: transactions?.map((t: any) => ({
        id: t.id,
        userId: t.user_address,
        userName: t.profiles?.name || "Unknown",
        amount: t.amount,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })) || [],
    });
  } catch (error) {
    console.error("Error fetching PAJ transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch PAJ transactions" },
      { status: 500 }
    );
  }
}
