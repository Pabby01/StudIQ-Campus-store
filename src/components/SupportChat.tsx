"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2 } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm the StudIQ AI Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

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
                setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later or contact our admin." }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please check your connection." }]);
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

    // Need to ask user on deployment where this ADMIN number comes from if not in ENV
    // For now assuming it will be provided or handled by the AI's link generation
    const adminWhatsApp = "1234567890"; // Fallback to environment variable process.env.NEXT_PUBLIC_ADMIN_WHATSAPP
    const whatsappLink = `https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || adminWhatsApp}`;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-xl w-80 sm:w-96 mb-4 border border-border-gray pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-primary-blue p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">StudIQ Support</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[10px] opacity-90">AI Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === "user" ? "bg-gray-200" : "bg-blue-100"
                                    }`}>
                                    {msg.role === "user" ? <User className="w-3 h-3 text-gray-600" /> : <Bot className="w-3 h-3 text-primary-blue" />}
                                </div>
                                <div
                                    className={`p-3 rounded-2xl text-sm ${msg.role === "user"
                                            ? "bg-primary-blue text-white rounded-tr-none"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {/* Simple link parsing could go here, but React renders strings safely */}
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-2 self-start max-w-[85%]">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mt-1">
                                    <Bot className="w-3 h-3 text-primary-blue" />
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action: Talk to Human */}
                    <div className="px-4 pb-2 bg-gray-50">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-blue hover:underline flex items-center justify-end gap-1"
                        >
                            Need human help? Chat on WhatsApp
                        </a>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your question..."
                                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-blue/30 rounded-xl text-sm outline-none transition-all"
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-blue hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
                    className="pointer-events-auto bg-primary-blue hover:bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-110 active:scale-95 group relative"
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="absolute right-0 top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            )}
        </div>
    );
}
