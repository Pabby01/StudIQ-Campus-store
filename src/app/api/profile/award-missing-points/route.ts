import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/session";
import { requireAdmin } from "@/lib/admin-auth";
import { POINTS } from "@/lib/constants";

// POST /api/profile/award-missing-points - Award points to profiles that missed welcome bonus
export async function POST(req: Request) {
    try {
        const address = await getSessionWallet(req);
        await requireAdmin(address);
        const supabase = getSupabaseServerClient();

        // Get all complete profiles
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("address, name, school, campus, email")
            .not("name", "is", null)
            .not("school", "is", null)
            .not("campus", "is", null);

        if (profilesError) {
            console.error("Failed to fetch profiles:", profilesError);
            return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
        }

        console.log(`Found ${profiles?.length || 0} complete profiles`);

        let awarded = 0;
        let skipped = 0;

        for (const profile of profiles || []) {
            // Check if this profile already has ANY points
            const { data: existingPoints, error: checkError } = await supabase
                .from("points_log")
                .select("id, reason")
                .eq("address", profile.address)
                .limit(1);

            console.log(`Checking ${profile.email}: existingPoints =`, existingPoints, 'error =', checkError);

            if (!existingPoints || existingPoints.length === 0) {
                // Award welcome points
                const { error: insertError } = await supabase.from("points_log").insert({
                    address: profile.address,
                    points: POINTS.PROFILE_COMPLETE,
                    reason: "Welcome bonus - Profile created",
                });

                if (insertError) {
                    console.error(`Failed to award points to ${profile.address}:`, insertError);
                    skipped++;
                } else {
                    console.log(`✅ Awarded 50 points to ${profile.email || profile.address}`);
                    awarded++;
                }
            } else {
                console.log(`⏭️ Skipped ${profile.email || profile.address} - already has ${existingPoints.length} point entries`);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            awarded,
            skipped,
            total: profiles?.length || 0,
        });
    } catch (error) {
        console.error("Award missing points error:", error);
        if (error instanceof Error && error.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
