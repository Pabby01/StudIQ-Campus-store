import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWebinarRegistrationEmail } from "@/lib/email";

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
    const { error, data } = await supabase
      .from("webinar_registrations")
      .insert([
        {
          name,
          email,
          wallet_address: wallet_address || null,
        },
      ])
      .select();

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

    // Prepare order details for email
    const orderId = data?.[0]?.id?.substring(0, 8) || Math.floor(Math.random() * 1000000000).toString();
    const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Send confirmation email
    await sendWebinarRegistrationEmail(name, email, orderId, orderDate);

    return NextResponse.json({ success: true, message: "Registered successfully!" });
  } catch (error: any) {
    console.error("[Webinar Registration Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
