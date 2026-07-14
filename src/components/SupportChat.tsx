/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Loader2, GraduationCap } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const cleanAssistantText = (text: string) => {
    if (!text) return "";
    return text.replace(/[*`]+/g, "");
};

export default function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hey! I'm Studi, your campus shopping buddy!\n\nAsk me about products, deliveries, or how to earn rewards!" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... scroll effect

    const sendMessage = async (userMsg: string) => {
        if (!userMsg.trim() || isTyping) return;
        const text = userMsg.trim();
        setInput(prev => (prev === text ? "" : prev));
        setMessages(prev => [...prev, { role: "user", content: text }]);
        setIsTyping(true);

        try {
            const response = await fetch("/api/support/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: "assistant", content: "Oof, my brain froze! 🥶 Please try again in a sec." }]);
            } else {
                const replyText = typeof data.reply === "string" ? data.reply : "";
                const cleanedReply = cleanAssistantText(replyText);
                setMessages(prev => [...prev, { role: "assistant", content: cleanedReply }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Network glitch! 📡 Check your wifi?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput("");
        await sendMessage(userMsg);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "2349020250260";
    // Custom message encoded for URL
    const customMessage = encodeURIComponent("Hello Support, I need help with the StudIQ Campus Store app.");
    const whatsappLink = `https://wa.me/${adminWhatsApp}?text=${customMessage}`;

    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    useEffect(() => {
        const last = messages[messages.length - 1];
        if (!last || isOpen) return;
        if (last.role === "assistant") setHasUnread(true);
    }, [messages, isOpen]);

    const quickPrompts: string[] = [
        "How do I sell an item on StudIQ Campus Store?",
        "How does delivery and returns work on StudIQ?",
        "How can I earn and use points and subscriptions?"
    ];

    return (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-3xl shadow-2xl w-[340px] max-w-[92vw] h-[500px] max-h-[70vh] mb-4 border border-slate-200 pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                    {/* Header with Gradient */}
                    <div className="bg-slate-950 p-4 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base tracking-wide flex items-center gap-1">
                                    Studi
                                </h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse box-content border border-white/20" />
                                    <span className="text-xs font-medium">Support</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4 min-h-0">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-slate-200" : "bg-slate-900"
                                    }`}>
                                    {msg.role === "user" ? (
                                        <User className="w-4 h-4 text-slate-700" />
                                    ) : (
                                        <MessageCircle className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div
                                    className={`p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap font-medium">
                                        {msg.role === "assistant" ? cleanAssistantText(msg.content) : msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-2 self-start max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-sm">
                                    <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                            {quickPrompts.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => void sendMessage(q)}
                                    className="px-3 py-1 text-xs rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                                    disabled={isTyping}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action: Talk to Human */}
                    <div className="bg-slate-50 px-4 pb-2">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 mx-auto w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
                        >
                            <span>Need a human? Chat on WhatsApp</span>
                        </a>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <div className="relative shadow-sm rounded-xl">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Studi anything..."
                                className="w-full pr-12 pl-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium resize-none min-h-[46px] max-h-32 overflow-y-auto"
                                rows={1}
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-1.5 bottom-1.5 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto bg-slate-950 text-white p-3.5 rounded-full shadow-lg shadow-black/30 transition-all hover:scale-105 active:scale-95 group relative border border-white/10"
                >
                    <MessageCircle className="w-6 h-6" />
                    {hasUnread && (
                        <span className="absolute right-0 top-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white -top-1 -right-1"></span>
                    )}
                </button>
            )}
        </div>
    );
}
