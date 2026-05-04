import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SavedAddress {
  id: string;
  address: string; // wallet address
  name: string;
  location: string;
  city: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Get saved addresses from user profile metadata
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("saved_addresses")
      .eq("address", address)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const addresses = profile?.saved_addresses || [];

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, name, location, city, zip, phone, isDefault } = body;

    if (!address || !name || !location || !city || !zip) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current saved addresses
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("saved_addresses")
      .eq("address", address)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    const savedAddresses = profile?.saved_addresses || [];
    const newAddressId = `addr_${Date.now()}`;

    const newAddress: SavedAddress = {
      id: newAddressId,
      address,
      name,
      location,
      city,
      zip,
      phone,
      isDefault: isDefault || savedAddresses.length === 0, // First address is default
      createdAt: new Date().toISOString(),
    };

    // If this is set as default, unset other defaults
    let updatedAddresses = savedAddresses.map((addr: SavedAddress) => ({
      ...addr,
      isDefault: isDefault && addr.id !== newAddressId ? false : addr.isDefault,
    }));

    updatedAddresses.push(newAddress);

    // Save updated addresses
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ saved_addresses: updatedAddresses })
      .eq("address", address);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      address: newAddress,
    });
  } catch (error) {
    console.error("Error saving address:", error);
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, addressId, name, location, city, zip, phone, isDefault } = body;

    if (!address || !addressId) {
      return NextResponse.json(
        { error: "Missing address or addressId" },
        { status: 400 }
      );
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("saved_addresses")
      .eq("address", address)
      .single();

    if (fetchError) throw fetchError;

    let updatedAddresses = (profile?.saved_addresses || []).map(
      (addr: SavedAddress) => {
        if (addr.id === addressId) {
          return {
            ...addr,
            name: name || addr.name,
            location: location || addr.location,
            city: city || addr.city,
            zip: zip || addr.zip,
            phone: phone !== undefined ? phone : addr.phone,
            isDefault: isDefault !== undefined ? isDefault : addr.isDefault,
          };
        }
        // Unset other defaults if this one is being set as default
        if (isDefault && addr.id !== addressId) {
          return { ...addr, isDefault: false };
        }
        return addr;
      }
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ saved_addresses: updatedAddresses })
      .eq("address", address);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      addresses: updatedAddresses,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const addressId = searchParams.get("addressId");

    if (!address || !addressId) {
      return NextResponse.json(
        { error: "Missing address or addressId" },
        { status: 400 }
      );
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("saved_addresses")
      .eq("address", address)
      .single();

    if (fetchError) throw fetchError;

    const updatedAddresses = (profile?.saved_addresses || []).filter(
      (addr: SavedAddress) => addr.id !== addressId
    );

    // If deleted address was default, set the first remaining as default
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a: SavedAddress) => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ saved_addresses: updatedAddresses })
      .eq("address", address);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      addresses: updatedAddresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
