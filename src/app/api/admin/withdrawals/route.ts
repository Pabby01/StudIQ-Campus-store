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
      .from("withdrawals")
      .select("*, stores(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: withdrawals, error } = await query;

    if (error) throw error;

    // Get all withdrawals for stats
    const { data: allWithdrawals } = await supabase
      .from("withdrawals")
      .select("status, amount");

    const totalWithdrawals = allWithdrawals?.length || 0;
    const totalAmount = allWithdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
    const completedWithdrawals = allWithdrawals?.filter((w) => w.status === "completed").length || 0;
    const pendingWithdrawals = allWithdrawals?.filter((w) => w.status === "pending").length || 0;
    const failedWithdrawals = allWithdrawals?.filter((w) => w.status === "failed").length || 0;

    return NextResponse.json({
      totalWithdrawals,
      totalAmount,
      completedWithdrawals,
      pendingWithdrawals,
      failedWithdrawals,
      withdrawals: withdrawals?.map((w: any) => ({
        id: w.id,
        storeId: w.store_id,
        storeName: w.stores?.name || "Unknown",
        amount: w.amount,
        status: w.status,
        method: w.method,
        accountDetails: w.account_details,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })) || [],
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
