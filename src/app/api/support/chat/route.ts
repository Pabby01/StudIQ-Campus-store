import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `
You are the helpful AI assistant for **StudIQ Campus Store**, a platform where students can buy and sell products using SOL (Solana) or USDC.
Your goal is to assist users with common questions about the platform.

**Core Knowledge:**
1.  **Platform Purpose:** A marketplace for students to trade items efficiently using crypto.
2.  **Payments:** We accept Solana (SOL) and USDC. Payments are secure and instant.
3.  **Delivery:** We offer Shipping (paid by buyer usually) and Pickup options.
4.  **Wallets:** Users connect with Solana wallets (Phantom, Solflare) or use our embedded Civic wallet (email login).
5.  **Rewards:** Users earn points for purchases and sales.
6.  **Support:** If you cannot answer a question or if it's a technical issue/dispute, direct them to Human Support.

**Tone:** Friendly, professional, concise, and helpful.

**Escalation:**
If the user's issue is complex (e.g., "I didn't receive my order", "Payment failed but money deducted"), apologize and provide the Admin WhatsApp link.
Use this specific link format for escalation: https://wa.me/${process.env.ADMIN_WHATSAPP || "1234567890"}
Tell them: "I can't access your specific order details directly. Please contact our support team on WhatsApp here: [Link]"
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing");
            return NextResponse.json(
                { error: "AI service is currently unavailable. Please contact support." },
                { status: 503 }
            );
        }

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Construct the chat history for the model
        // Gemini uses 'user' and 'model' roles.
        // 'history' from client should be mapped: user -> user, assistant -> model
        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist StudIQ Campus Store users." }]
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
