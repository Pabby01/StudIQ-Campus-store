import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

import { getSupabaseServerClient } from "@/lib/supabase";

// Base prompt is static, but dynamic context will be prepended
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
- **Support:** For disputes/technical issues, escalate to Admin.

**Escalation:**
If you can't solve it, say: "Oh no! 🙈 I might need a human for this one. Reach out to our team on WhatsApp:"
Link: https://wa.me/${process.env.ADMIN_WHATSAPP || "1234567890"}
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Studi is taking a nap (AI Service Unavailable)." },
                { status: 503 }
            );
        }

        if (!message) {
            return NextResponse.json({ error: "Say something!" }, { status: 400 });
        }

        // Fetch Dynamic Context (Products & Categories)
        const supabase = getSupabaseServerClient();

        // Fetch up to 10 recent products to give the AI some "awareness"
        const { data: products } = await supabase
            .from("products")
            .select("name, price, currency, category, description")
            .order("created_at", { ascending: false })
            .limit(10);

        // Fetch unique categories (simple aggregation if no separate table)
        // If we don't have a categories table, we infer from products
        const categories = Array.from(new Set(products?.map(p => p.category) || []));

        let contextString = "\n**Current Store Context:**\n";
        if (products && products.length > 0) {
            contextString += `Recent Products Available:\n${products.map(p => `- ${p.name} (${p.currency === 'SOL' ? p.price + ' SOL' : '$' + p.price}) in ${p.category}`).join("\n")}\n`;
            contextString += `\nPopular Categories: ${categories.join(", ")}\n`;
        } else {
            contextString += "No products listed currently.\n";
        }

        // Navigation Guide
        contextString += `\n**Navigation Guide:**
- Home: /
- Shop/Browse: /search
- Dashboard: /dashboard
- Cart: /cart
- Wallet/Points: /dashboard/wallet
- Sell an Item: /dashboard/store/products/new
`;

        const finalSystemPrompt = BASE_SYSTEM_PROMPT + contextString;

        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: finalSystemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Hey there! I'm Studi. Ready to help you ace your campus shopping! 🎓✨" }]
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });
    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to process your request." },
            { status: 500 }
        );
    }
}
