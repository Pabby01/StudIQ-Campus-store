import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      address,
      device_type,
      device_os,
      browser,
      browser_version,
      user_agent,
      city,
      country,
    } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Missing address" },
        { status: 400 }
      );
    }

    // Update profile with device and location info
    const { error } = await supabase
      .from("profiles")
      .update({
        device_type: device_type || null,
        device_os: device_os || null,
        browser: browser || null,
        browser_version: browser_version || null,
        user_agent: user_agent || null,
        city: city || null,
        country: country || null,
        last_login: new Date().toISOString(),
      })
      .eq("address", address);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating device info:", error);
    return NextResponse.json(
      { error: "Failed to update device info" },
      { status: 500 }
    );
  }
}
