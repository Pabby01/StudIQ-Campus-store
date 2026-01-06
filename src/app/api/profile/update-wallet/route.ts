import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { email, walletAddress, civicUserId } = await req.json();

        console.log("[update-wallet] Received:", { email, walletAddress, civicUserId });

        if (!email || !walletAddress) {
            return Response.json(
                { ok: false, error: "Email and wallet address required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // First, find the profile by email
        const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (findError) {
            console.error("[update-wallet] Find error:", findError);
            return Response.json(
                { ok: false, error: "Failed to find profile" },
                { status: 500 }
            );
        }

        if (!profile) {
            console.log("[update-wallet] Profile not found for email:", email);
            return Response.json(
                { ok: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        const oldAddress = profile.address;
        console.log("[update-wallet] Found profile with address:", oldAddress);

        // Check if wallet already matches
        if (oldAddress === walletAddress) {
            console.log("[update-wallet] Wallet already up to date");
            return Response.json({ ok: true, profile, message: "Already up to date" });
        }

        // Step 1: Get existing points for this profile
        const { data: existingPoints } = await supabase
            .from("points_log")
            .select("*")
            .eq("address", oldAddress);

        console.log("[update-wallet] Found", existingPoints?.length || 0, "points entries to migrate");

        // Step 2: DELETE the old points_log entries (to remove FK constraint)
        if (existingPoints && existingPoints.length > 0) {
            const { error: deletePointsError } = await supabase
                .from("points_log")
                .delete()
                .eq("address", oldAddress);

            if (deletePointsError) {
                console.error("[update-wallet] Points delete error:", deletePointsError);
            } else {
                console.log("[update-wallet] ✓ Deleted old points entries");
            }
        }

        // Step 3: Update the profile with the new wallet address
        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
                address: walletAddress,
                civic_user_id: civicUserId || profile.civic_user_id,
                last_login: new Date().toISOString(),
            })
            .eq("email", email)
            .select()
            .single();

        if (updateError) {
            console.error("[update-wallet] Update error:", updateError);

            // Try to restore the points if update failed
            if (existingPoints) {
                for (const point of existingPoints) {
                    await supabase.from("points_log").insert({
                        address: oldAddress,
                        points: point.points,
                        reason: point.reason,
                    });
                }
            }

            return Response.json(
                { ok: false, error: "Failed to update wallet address" },
                { status: 500 }
            );
        }

        console.log("[update-wallet] ✓ Updated profile address");

        // Step 4: Recreate points with the new address
        if (existingPoints && existingPoints.length > 0) {
            for (const point of existingPoints) {
                const { error: insertPointError } = await supabase
                    .from("points_log")
                    .insert({
                        address: walletAddress,
                        points: point.points,
                        reason: point.reason,
                    });

                if (insertPointError) {
                    console.error("[update-wallet] Points recreate error:", insertPointError);
                }
            }
            console.log("[update-wallet] ✓ Recreated points entries with new address");
        }

        // Step 5: Update other tables (no FK constraints on these)
        await supabase
            .from("orders")
            .update({ buyer_address: walletAddress })
            .eq("buyer_address", oldAddress);

        await supabase
            .from("stores")
            .update({ owner_address: walletAddress })
            .eq("owner_address", oldAddress);

        console.log("[update-wallet] ✅ Successfully updated wallet from", oldAddress, "to", walletAddress);

        return Response.json({ ok: true, profile: updatedProfile });
    } catch (error) {
        console.error("[update-wallet] Server error:", error);
        return Response.json(
            { ok: false, error: "Server error" },
            { status: 500 }
        );
    }
}
