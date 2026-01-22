/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

const BASE_SYSTEM_PROMPT = `
You are **Studi** (short for StudIQ), the friendly and knowledgeable AI assistant for the **StudIQ Campus Store**.
Your goal is to help students buy, sell, and navigate the platform with a fun, supportive, and "student-inclined" vibe.

**Your Persona:**
- Name: **Studi**
- Vibe: Casual, encouraging, helpful, emojis allowed but professional when needed. Like a smart study buddy.
- User Context: You are talking to students.
- Knowledge: You know about the products listed below and the store generally.

**Core Platform Info:**
- **What is this?** A decentralized marketplace for students to trade items using crypto (SOL/USDC).
- **Payments:** Secure Solana payments or "Pay on Delivery".
- **Delivery:** Shipping or Pickup.
- **Rewards:** Earn points for every trade!
  Examples: +150 for completing profile, +100 for first purchase, +5 per product listed,
  +10 per completed order or review, milestone bonuses for 10/50/100 sales.
- **Support:** For disputes/technical issues, escalate to Admin.

**Escalation:**
If you can't solve it, say: "Oh no! 🙈 I might need a human for this one. Reach out to our team on WhatsApp:"
Link: https://wa.me/${process.env.ADMIN_WHATSAPP || "+2349020250260"}
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "Studi is taking a nap (AI Service Unavailable)." },
                { status: 503 }
            );
        }

        if (!message) {
            return NextResponse.json({ error: "Say something!" }, { status: 400 });
        }

        let products: Array<{ name: string; price: number; currency: string; category: string; description: string }> = [];
        let storeCount: number | null = null;
        let productCount: number | null = null;
        try {
            const supabase = getSupabaseServerClient();
            const { data } = await supabase
                .from("products")
                .select("name, price, currency, category, description")
                .order("created_at", { ascending: false })
                .limit(5);
            products = data || [];
            const storesRes = await supabase.from("stores").select("id", { count: "exact", head: true });
            storeCount = storesRes.count ?? null;
            const productsRes = await supabase.from("products").select("id", { count: "exact", head: true });
            productCount = productsRes.count ?? null;
        } catch {
            products = [];
        }

        const categories = Array.from(new Set(products?.map(p => p.category) || []));

        let contextString = "\n**Current Store Context:**\n";
        if (products && products.length > 0) {
            contextString += `Recent Products:\n${products.map(p => `- ${p.name} ($${p.price})`).join("\n")}\n`;
            contextString += `\nCategories: ${categories.join(", ")}\n`;
        } else {
            contextString += "No products listed currently.\n";
        }
        contextString += `\nCatalog Categories: ${CATEGORIES.join(", ")}\n`;
        if (storeCount !== null || productCount !== null) {
            contextString += `\nMarketplace Stats: ${productCount ?? "?"} products, ${storeCount ?? "?"} stores\n`;
        }

        contextString += `\n**Navigation Guide:**
- Home: /
- Shop/Browse: /search
- Dashboard: /dashboard
- Cart: /cart
- Wallet/Points: /dashboard/wallet
- Sell an Item: /dashboard/store/products/new
- Stores: /stores
- Orders: /dashboard/orders
- Pricing: /pricing
- FAQ: /faq
- Track Order: /track
`;
        contextString += `\n**Platform Capabilities:**
- Create stores, list products, and manage inventory
- Checkout with SOL/USDC and track orders
- Earn points and view leaderboard
- Profile management, reviews, wishlists, and notifications
`;

        contextString += `\n**Pricing Plans Overview (from /pricing):**
- Free: 5% fee, 1 store, unlimited products, basic analytics, email support, marketplace access.
- Premium: 2% fee, up to 5 stores, everything in Free, premium badge, priority search, 2x points, advanced analytics, priority support.
- Enterprise: 0% fee, up to 20 stores, everything in Premium, dedicated account manager, API access, custom branding, advanced fraud protection.
`;

        contextString += `\n**How to Help Users:**
- Explain how to buy, sell, track orders, and earn points.
- Point them to the right page using the URLs above.
- Keep answers consistent with FAQ (/faq) and pricing (/pricing) content.
- Be concise, clear, and student-friendly.`;

        const finalSystemPrompt = BASE_SYSTEM_PROMPT + contextString;

        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
        }));

        const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    { role: "assistant", content: "Hey there! I'm Studi. Ready to help you ace your campus shopping! 🎓✨" },
                    ...chatHistory,
                    { role: "user", content: message },
                ],
                max_tokens: 500,
            }),
        });

        if (!openAiRes.ok) {
            const errorBody = await openAiRes.text();
            return NextResponse.json(
                { error: "Studi tripped over a virtual wire! 🔌 Try again later.", details: errorBody },
                { status: 502 }
            );
        }

        const data = await openAiRes.json();
        const text = data?.choices?.[0]?.message?.content ?? "";

        return NextResponse.json({ reply: text });
    } catch (error: any) {
        console.error("AI Chat Error:", error);

        if (error.message?.includes("429") || error.status === 429) {
            return NextResponse.json(
                { error: "Whoa, so many questions! 🤯 Studi needs a quick breather. Try again in a minute!" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Studi tripped over a virtual wire! 🔌 Try again later." },
            { status: 500 }
        );
    }
}
