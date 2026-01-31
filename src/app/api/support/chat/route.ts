/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import { getSessionWallet } from "@/lib/session";
import { getBalance } from "@/lib/solana";
import { SOLANA_CONFIG } from "@/lib/solana-config";
import { Connection, PublicKey } from "@solana/web3.js";

const BASE_SYSTEM_PROMPT = `
You are **Studi** (short for StudIQ), the friendly and knowledgeable AI assistant for the **StudIQ Campus Store**.
Your goal is to help students buy, sell, and navigate the platform with a fun, supportive, and "student-inclined" vibe.

**Your Persona:**
- Name: Studi
- Vibe: Casual, encouraging, helpful, emojis allowed but professional when needed. Like a smart study buddy.
- User Context: You are talking to students.
- Knowledge: You know about the products listed below and the store generally.

**Formatting Rules:**
- Respond in plain text only.
- Do NOT use Markdown formatting like **bold**, *italics*, bullet markers, or backticks.
- Avoid surrounding words or numbers with asterisks.

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
        const sessionAddress = await getSessionWallet(req);

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
        let userContext = "";
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

            if (sessionAddress) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, school, campus")
                    .eq("address", sessionAddress)
                    .maybeSingle();

                const { data: pointsData } = await supabase
                    .from("points_log")
                    .select("points")
                    .eq("address", sessionAddress);

                const totalPoints = pointsData?.reduce((sum, log) => sum + (log.points || 0), 0) || 0;

                const { data: buyerOrders } = await supabase
                    .from("orders")
                    .select("id, amount, currency, status, created_at")
                    .eq("buyer_address", sessionAddress)
                    .order("created_at", { ascending: false })
                    .limit(5);

                let walletBalanceSol: number | null = null;
                let walletBalanceSolUsd: number | null = null;
                let walletBalanceUsdc: number | null = null;
                let solPriceUsd: number | null = null;
                let totalWalletUsd: number | null = null;

                try {
                    walletBalanceSol = await getBalance(sessionAddress);
                } catch {
                    walletBalanceSol = null;
                }

                try {
                    const priceRes = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/price/sol`
                    );
                    if (priceRes.ok) {
                        const { price } = await priceRes.json();
                        if (typeof price === "number" && !Number.isNaN(price)) {
                            solPriceUsd = price;
                        }
                    }
                } catch {
                    solPriceUsd = null;
                }

                try {
                    const rpcUrl =
                        SOLANA_CONFIG.rpcUrl ||
                        (SOLANA_CONFIG.network === "mainnet"
                            ? process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com"
                            : process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com");

                    const connection = new Connection(rpcUrl);
                    const walletPubkey = new PublicKey(sessionAddress);
                    const mintPubkey = new PublicKey(SOLANA_CONFIG.usdcMint);

                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
                        mint: mintPubkey,
                    });

                    if (tokenAccounts.value.length > 0) {
                        const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
                        const uiAmount = accountInfo.tokenAmount?.uiAmount;
                        if (typeof uiAmount === "number" && !Number.isNaN(uiAmount)) {
                            walletBalanceUsdc = uiAmount;
                        }
                    }
                } catch {
                    walletBalanceUsdc = null;
                }

                if (walletBalanceSol !== null && solPriceUsd !== null) {
                    walletBalanceSolUsd = walletBalanceSol * solPriceUsd;
                }

                if (walletBalanceSolUsd !== null || walletBalanceUsdc !== null) {
                    totalWalletUsd = (walletBalanceSolUsd || 0) + (walletBalanceUsdc || 0);
                }

                const totalSpent = (buyerOrders || []).reduce((sum, o) => {
                    const amt = o.amount || 0;
                    return sum + Number(amt);
                }, 0);

                const shortAddress = sessionAddress.length > 12
                    ? `${sessionAddress.slice(0, 4)}...${sessionAddress.slice(-4)}`
                    : sessionAddress;

                userContext += `\n**User Session Snapshot:**\n`;
                userContext += `Wallet Address: ${shortAddress}\n`;
                if (walletBalanceSol !== null) {
                    userContext += `Approx Wallet Balance: ${walletBalanceSol.toFixed(4)} SOL`;
                    if (walletBalanceSolUsd !== null) {
                        userContext += ` (~$${walletBalanceSolUsd.toFixed(2)} USD at latest price)\n`;
                    } else {
                        userContext += `\n`;
                    }
                }
                if (walletBalanceUsdc !== null) {
                    userContext += `USDC Balance: ${walletBalanceUsdc.toFixed(2)} (~$${walletBalanceUsdc.toFixed(2)} USD)\n`;
                }
                if (totalWalletUsd !== null) {
                    userContext += `Estimated Total Wallet Value (SOL + USDC): ~$${totalWalletUsd.toFixed(2)} USD\n`;
                }
                if (profile) {
                    userContext += `Profile: ${profile.name || "Unknown"} at ${profile.school || "Unknown school"} ${profile.campus ? `(${profile.campus})` : ""}\n`;
                }
                userContext += `Reward Points (store only): ${totalPoints}\n`;
                userContext += `Recent Purchases (latest ${buyerOrders?.length || 0}):\n`;

                if (buyerOrders && buyerOrders.length > 0) {
                    buyerOrders.forEach((order) => {
                        const idShort = order.id ? String(order.id).slice(0, 8).toUpperCase() : "UNKNOWN";
                        const amount = Number(order.amount || 0).toFixed(2);
                        userContext += `- Order ${idShort}: ${amount} ${order.currency || "USD"} (${order.status})\n`;
                    });
                } else {
                    userContext += `- No completed purchases yet.\n`;
                }

                userContext += `Total Spent As Buyer (all time, raw sum): ${totalSpent.toFixed(2)} (mixed currencies)\n`;
                userContext += `When asked about "my wallet", "my balance", "my orders", or "my spending", use this snapshot.\n`;
            }
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
- Be concise, clear, and student-friendly.
- If a User Session Snapshot is available, use it to answer questions about their wallet, points, spending, recent orders, and approximate USD value.
- When users ask for conversions like "in USD", use the wallet balances and latest SOL price from the snapshot instead of guessing.
- When giving financial suggestions, be conservative, encourage budgeting, and avoid pushing users to overspend.`;

        const finalSystemPrompt = BASE_SYSTEM_PROMPT + contextString + userContext;

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
