"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, Store, ShoppingCart, Award, DollarSign, Shield, HelpCircle } from "lucide-react";
import Card from "@/components/ui/Card";

type FAQItem = {
    question: string;
    answer: string;
};

type FAQSection = {
    title: string;
    icon: React.ElementType;
    items: FAQItem[];
};

const faqData: FAQSection[] = [
    {
        title: "Getting Started",
        icon: HelpCircle,
        items: [
            {
                question: "How do I connect my Solana wallet?",
                answer: "Click the 'Connect' button in the top right corner and select your preferred Solana wallet (Phantom, Solflare, etc.). Make sure you have a wallet installed in your browser extension."
            },
            {
                question: "Do I need a wallet to browse products?",
                answer: "No! You can browse products freely. However, to make purchases or create a store, you'll need to connect your Solana wallet."
            },
            {
                question: "How do I create a profile?",
                answer: "After connecting your wallet, click on 'Dashboard' and navigate to settings. Fill in your details including name, school, and campus to complete your profile and earn 50 bonus points!"
            }
        ]
    },
    {
        title: "Buying & Shopping",
        icon: ShoppingCart,
        items: [
            {
                question: "How do I place an order?",
                answer: "Browse products, add items to cart, then proceed to checkout. You can pay with SOL, USDC, or choose Pay on Delivery (POD) for eligible items."
            },
            {
                question: "What payment methods are supported?",
                answer: "We support Solana (SOL), USDC stablecoin, and Pay on Delivery (POD) for selected products. Payment is instant for crypto transactions."
            },
            {
                question: "How do I track my order?",
                answer: "Visit the 'Track Order' page and enter your Order ID (first 8 characters shown on your receipt). You'll see real-time status updates including processing, shipped, and delivered."
            },
            {
                question: "Can I cancel or return an order?",
                answer: "Contact the seller through their store page before the order ships. Return policies vary by store, so check the seller's terms."
            }
        ]
    },
    {
        title: "Selling on StudIQ",
        icon: Store,
        items: [
            {
                question: "How do I create a store?",
                answer: "Navigate to Dashboard → My Store → Create Store. Fill in your store details, category, and location. Creating a store earns you 100 reward points!"
            },
            {
                question: "How much does it cost to sell?",
                answer: "Creating a store and listing products is FREE! We only take a 5% platform fee on completed sales."
            },
            {
                question: "How do I add products?",
                answer: "Go to Dashboard → Products → Add Product. Include product name, description, price (SOL or USD), inventory, and images. Each product listing earns you 5 points!"
            },
            {
                question: "How do I manage orders?",
                answer: "Access all your orders in Dashboard → Sales Orders. You can update order status to 'Processing', 'Shipped', or 'Completed'. Completing orders earns you 10 points each!"
            },
            {
                question: "When do I receive payment?",
                answer: "Payments are sent directly to your wallet address immediately when buyers complete Solana/USDC transactions. For POD orders, payment comes when the buyer pays on delivery."
            }
        ]
    },
    {
        title: "Points & Rewards System",
        icon: Award,
        items: [
            {
                question: "How do I earn points?",
                answer: "Earn points through various activities: Making purchases (5% of order value), Listing products (+5pts), Creating a store (+100pts), Writing reviews (+10pts), Adding to wishlist (+2pts), Completing your profile (+50pts), Getting 5-star reviews (+25pts), and reaching sales milestones (+50/100/500pts)."
            },
            {
                question: "What can I use points for?",
                answer: "Currently, points are being tracked for our upcoming token airdrop! Future uses will include platform fee discounts, exclusive features, and redemption for our native token."
            },
            {
                question: "Do points expire?",
                answer: "No! Your points never expire and will be converted to our platform token when it launches."
            },
            {
                question: "How do I check my points balance?",
                answer: "Your total points are displayed on your Dashboard. You can also see your rank on the Leaderboard page."
            },
            {
                question: "What are sales milestones?",
                answer: "Sellers earn bonus points for reaching milestones: 10 sales (+50pts), 50 sales (+100pts), 100 sales (+500pts). Keep selling to unlock these rewards!"
            }
        ]
    },
    {
        title: "Pricing & Fees",
        icon: DollarSign,
        items: [
            {
                question: "What are the platform fees?",
                answer: "We charge a 5% fee on completed sales. This fee is automatically calculated and deducted from the seller's earnings."
            },
            {
                question: "Can I set prices in USD or SOL?",
                answer: "Yes! You can price products in either SOL or USD (via USDC). Buyers will pay in the currency you've chosen."
            },
            {
                question: "Are there network fees?",
                answer: "Solana transactions have minimal network fees (usually less than $0.01). These are paid by the sender during transactions."
            },
            {
                question: "Is there a listing fee?",
                answer: "No! Listing products is completely FREE. You only pay when you make a sale."
            }
        ]
    },
    {
        title: "Security & Privacy",
        icon: Shield,
        items: [
            {
                question: "Is my wallet secure?",
                answer: "We never have access to your private keys. Your wallet remains under your full control. We only read your public address for transactions."
            },
            {
                question: "How is payment secured?",
                answer: "All Solana/USDC transactions are verified on-chain before orders are confirmed. The blockchain provides cryptographic proof of payment."
            },
            {
                question: "What information is public?",
                answer: "Only your wallet address, public profile information, and order history are visible. Personal details like email and phone are private and never shared."
            },
            {
                question: "How do I report a problem?",
                answer: "Contact support through the seller's store page or reach out to our support team. We investigate all reports promptly."
            }
        ]
    }
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Filter FAQ items based on search
    const filteredData = faqData.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.items.length > 0);

    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-black mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-muted-text">
                        Everything you need to know about StudIQ Campus Store
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                    </div>
                </div>

                {/* FAQ Sections */}
                <div className="space-y-6">
                    {filteredData.map((section, sectionIdx) => (
                        <Card key={sectionIdx} className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <section.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-black">{section.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {section.items.map((item, itemIdx) => {
                                    const id = `${sectionIdx}-${itemIdx}`;
                                    const isOpen = openItems.includes(id);

                                    return (
                                        <div
                                            key={itemIdx}
                                            className="border border-border-gray rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleItem(id)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-medium text-black pr-4">
                                                    {item.question}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-text flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-text flex-shrink-0" />
                                                )}
                                            </button>

                                            {isOpen && (
                                                <div className="px-4 pb-4 text-muted-text border-t border-border-gray bg-gray-50">
                                                    <p className="pt-4">{item.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* No results */}
                {filteredData.length === 0 && (
                    <Card className="p-12 text-center">
                        <HelpCircle className="w-12 h-12 text-m uted-text mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">No matching questions found</h3>
                        <p className="text-muted-text">Try searching with different keywords</p>
                    </Card>
                )}

                {/* Contact Support */}
                <Card className="p-8 text-center mt-12 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="text-xl font-bold text-black mb-2">Still have questions?</h3>
                    <p className="text-muted-text mb-4">
                        Our support team is here to help!
                    </p>
                    <a
                        href="mailto:support@studiq.com"
                        className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Contact Support
                    </a>
                </Card>
            </div>
        </div>
    );
}
