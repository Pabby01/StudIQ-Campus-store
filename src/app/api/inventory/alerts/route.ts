import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  threshold: number; // Alert when inventory drops below this
  currentInventory: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const productId = searchParams.get("productId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("inventory_alerts")
      .select("*")
      .eq("store_id", storeId);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ alerts: data || [] });
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, productId, threshold } = body;

    if (!storeId || !productId || threshold === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product info
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, inventory")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Create alert
    const { data, error } = await supabase
      .from("inventory_alerts")
      .insert({
        store_id: storeId,
        product_id: productId,
        product_name: product.name,
        threshold,
        current_inventory: product.inventory,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      alert: data,
    });
  } catch (error) {
    console.error("Error creating inventory alert:", error);
    return NextResponse.json(
      { error: "Failed to create inventory alert" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, threshold, isActive } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("inventory_alerts")
      .update({
        threshold: threshold !== undefined ? threshold : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      alert: data,
    });
  } catch (error) {
    console.error("Error updating inventory alert:", error);
    return NextResponse.json(
      { error: "Failed to update inventory alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("inventory_alerts")
      .delete()
      .eq("id", alertId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting inventory alert:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory alert" },
      { status: 500 }
    );
  }
}
