import { getSupabaseServerClient } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const address = await getSessionWallet(req);
    if (!address) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', address)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const address = await getSessionWallet(req);
    if (!address) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const supabase = getSupabaseServerClient();

        if (body.action === 'markRead' && body.id) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', body.id)
                .eq('user_id', address); // Security check
            if (error) throw error;
        } else if (body.action === 'markAllRead') {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', address);
            if (error) throw error;
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const address = await getSessionWallet(req);
    if (!address) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', address); // Security check

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
