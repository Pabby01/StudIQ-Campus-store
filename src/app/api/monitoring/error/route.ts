export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.error("[Client Error]", body);
        return Response.json({ ok: true });
    } catch (error) {
        console.error("[Client Error] Failed to parse error report:", error);
        return Response.json({ ok: false }, { status: 400 });
    }
}
