"use client";

import { useState, useRef, useEffect } from "react";
// ... imports
import { MessageSquare, X, Send, User, Sparkles, Loader2, GraduationCap } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hey! I'm Studi, your campus shopping buddy! 🎓 \n\nAsk me about products, deliveries, or how to earn rewards!" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... scroll effect

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await fetch("/api/support/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: "assistant", content: "Oof, my brain froze! 🥶 Please try again in a sec." }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Network glitch! 📡 Check your wifi?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "1234567890";
    // Custom message encoded for URL
    const customMessage = encodeURIComponent("Hello Support, I need help with the StudIQ Campus Store app.");
    const whatsappLink = `https://wa.me/${adminWhatsApp}?text=${customMessage}`;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-3xl shadow-2xl w-[340px] mb-4 border border-indigo-50 pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base tracking-wide flex items-center gap-1">
                                    Studi
                                    <Sparkles className="w-3 h-3 text-yellow-300" />
                                </h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse box-content border border-white/20" />
                                    <span className="text-xs font-medium">Campus Pal</span>
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

                    {/* Messages Area */}
                    <div className="flex-1 h-[400px] overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-indigo-100" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                    }`}>
                                    {msg.role === "user" ? (
                                        <User className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <GraduationCap className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div
                                    className={`p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap font-medium">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-2 self-start max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-sm">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action: Talk to Human */}
                    <div className="bg-slate-50 px-4 pb-2">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-100 hover:bg-green-200 text-green-700 mx-auto w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-green-200"
                        >
                            <span>💬 Need a human? Chat on WhatsApp</span>
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
                                className="w-full pr-12 pl-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium resize-none min-h-[46px] max-h-32"
                                rows={1}
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-1.5 bottom-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm active:scale-95"
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
                    className="pointer-events-auto bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg shadow-indigo-500/40 transition-all hover:scale-110 active:scale-95 group relative border-2 border-white/20"
                >
                    <div className="relative">
                        <MessageSquare className="w-7 h-7" />
                        <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                    <span className="absolute right-0 top-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white absolute -top-1 -right-1"></span>
                </button>
            )}
        </div>
    );
}
