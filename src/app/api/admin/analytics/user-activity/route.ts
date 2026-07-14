import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_address,
      activity_type,
      page_url,
      device_type,
      device_os,
      browser,
      location_city,
      location_country,
      description,
    } = body;

    if (!user_address || !activity_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into user_activity table
    const { error } = await supabase.from("user_activity").insert({
      user_address,
      activity_type,
      description: description || "",
      page_url: page_url || "",
      device_type: device_type || "unknown",
      device_os: device_os || "unknown",
      browser: browser || "unknown",
      location_city: location_city || "Unknown",
      location_country: location_country || "Unknown",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging user activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
