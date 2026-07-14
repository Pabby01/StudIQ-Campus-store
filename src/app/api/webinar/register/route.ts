import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, wallet_address } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required." },
        { status: 400 }
      );
    }

    // Insert into database
    const { error } = await supabase
      .from("webinar_registrations")
      .insert([
        {
          name,
          email,
          wallet_address: wallet_address || null,
        },
      ]);

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: "Registered successfully!" });
  } catch (error: any) {
    console.error("[Webinar Registration Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
