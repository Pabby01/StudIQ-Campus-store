"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import PricingCard from "@/components/PricingCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calculator, Check, Crown, Star, TrendingUp } from "lucide-react";

export default function PricingPage() {
    const router = useRouter();
    const wallet = useWallet();
    const [monthlySales, setMonthlySales] = useState(1000);
    const [avgOrderValue, setAvgOrderValue] = useState(50);

    const plans = [
        {
            name: "free",
            displayName: "Free",
            price: 0,
            feePercentage: 5,
            maxStores: 1,
            features: [
                "Create 1 store",
                "List unlimited products",
                "Basic analytics dashboard",
                "Standard email support",
                "Earn reward points",
                "5% platform fee per sale",
                "Access to marketplace"
            ],
            buttonText: "Get Started Free"
        },
        {
            name: "premium",
            displayName: "Premium",
            price: 14.99,
            feePercentage: 2,
            maxStores: 5,
            popular: true,
            features: [
                "Create up to 5 stores",
                "Everything in Free",
                "Only 2% platform fee (save 3%)",
                "Premium badge on store",
                "Priority in search results",
                "2x reward points earning",
                "Advanced analytics & insights",
                "Priority customer support",
                "Featured store placement"
            ],
            buttonText: "Upgrade to Premium"
        },
        {
            name: "enterprise",
            displayName: "Enterprise",
            price: 49.99,
            feePercentage: 0,
            maxStores: 20,
            features: [
                "Create up to 20 stores",
                "Everything in Premium",
                "0% platform fee (save all fees!)",
                "Dedicated account manager",
                "API access for integrations",
                "Custom store branding",
                "Bulk product upload tools",
                "Advanced fraud protection",
                "White-label options"
            ],
            buttonText: "Contact Sales"
        }
    ];

    const handleSelectPlan = (planName: string) => {
        if (!wallet.connected) {
            router.push("/");
            return;
        }

        if (planName === "free") {
            router.push("/dashboard/store");
        } else if (planName === "enterprise") {
            window.location.href = "mailto:support@studiq.com?subject=Enterprise Plan Inquiry";
        } else {
            router.push(`/pricing/checkout?plan=${planName}`);
        }
    };

    // ROI Calculator
    const calculateSavings = (sales: number, orderValue: number) => {
        const totalRevenue = sales * orderValue;
        const freeFees = totalRevenue * 0.05;
        const premiumFees = totalRevenue * 0.02 + 14.99;
        const savings = freeFees - premiumFees;
        const breakEvenSales = 14.99 / (orderValue * 0.03);

        return {
            totalRevenue,
            freeFees,
            premiumFees,
            savings,
            breakEvenSales: Math.ceil(breakEvenSales)
        };
    };

    const calc = calculateSavings(monthlySales / avgOrderValue, avgOrderValue);

    return (
        <div className="min-h-screen bg-soft-gray-bg">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary-blue to-blue-700 text-white py-16 md:py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 mb-8">
                        Choose the plan that fits your business. Upgrade or downgrade anytime.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            <span>No setup fees</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            <span>14-day free trial</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.name}
                            {...plan}
                            onSelect={() => handleSelectPlan(plan.name)}
                        />
                    ))}
                </div>

                {/* ROI Calculator */}
                <Card className="p-6 md:p-8 mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Calculator className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-black">ROI Calculator</h2>
                            <p className="text-muted-text">See how much you could save with Premium</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monthly Sales Revenue ($)
                            </label>
                            <input
                                type="number"
                                value={monthlySales}
                                onChange={(e) => setMonthlySales(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                min="0"
                                step="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Average Order Value ($)
                            </label>
                            <input
                                type="number"
                                value={avgOrderValue}
                                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                min="1"
                                step="5"
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Free Plan Fees</p>
                                <p className="text-2xl font-bold text-red-600">${calc.freeFees.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Premium Plan Cost</p>
                                <p className="text-2xl font-bold text-blue-600">${calc.premiumFees.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Your Savings</p>
                                <p className="text-2xl font-bold text-green-600">${calc.savings.toFixed(2)}/mo</p>
                            </div>
                        </div>
                        {calc.savings > 0 ? (
                            <div className="bg-white rounded-lg p-4 border border-green-300">
                                <p className="text-sm text-gray-700">
                                    💡 <strong>Premium pays for itself after {calc.breakEvenSales} sales</strong> at your average order value.
                                    You'll save <strong>${(calc.savings * 12).toFixed(2)}/year</strong> with Premium!
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg p-4 border border-gray-300">
                                <p className="text-sm text-gray-700">
                                    At your current sales volume, the Free plan is more cost-effective.
                                    Consider upgrading as your sales grow!
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Feature Comparison */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-black text-center mb-8">Feature Comparison</h2>
                    <Card className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                                    <th className="px-4 md:px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                                    <th className="px-4 md:px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-blue-50">Premium</th>
                                    <th className="px-4 md:px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {[
                                    { feature: "Store Limit", free: "1 store", premium: "5 stores", enterprise: "20 stores" },
                                    { feature: "Platform Fee", free: "5%", premium: "2%", enterprise: "0%" },
                                    { feature: "Product Listings", free: "Unlimited", premium: "Unlimited", enterprise: "Unlimited" },
                                    { feature: "Premium Badge", free: false, premium: true, enterprise: true },
                                    { feature: "Priority Placement", free: false, premium: true, enterprise: true },
                                    { feature: "Advanced Analytics", free: false, premium: true, enterprise: true },
                                    { feature: "API Access", free: false, premium: false, enterprise: true },
                                    { feature: "Dedicated Support", free: false, premium: false, enterprise: true }
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                                        <td className="px-4 md:px-6 py-4 text-center text-sm">
                                            {typeof row.free === 'boolean' ? (
                                                row.free ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-400">—</span>
                                            ) : row.free}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center text-sm bg-blue-50">
                                            {typeof row.premium === 'boolean' ? (
                                                row.premium ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-400">—</span>
                                            ) : <strong className="text-blue-600">{row.premium}</strong>}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center text-sm">
                                            {typeof row.enterprise === 'boolean' ? (
                                                row.enterprise ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-400">—</span>
                                            ) : <strong className="text-purple-600">{row.enterprise}</strong>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>

                {/* FAQ */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-black text-center mb-8">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                q: "Can I change plans anytime?",
                                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
                            },
                            {
                                q: "Is there a free trial for Premium?",
                                a: "Yes, we offer a 14-day free trial for Premium. No credit card required to start."
                            },
                            {
                                q: "How do platform fees work?",
                                a: "Platform fees are automatically deducted from each sale. The percentage depends on your plan: 5% (Free), 2% (Premium), or 0% (Enterprise)."
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept SOL and USDC for subscription payments directly through your connected wallet."
                            }
                        ].map((faq, i) => (
                            <Card key={i} className="p-6">
                                <h3 className="font-bold text-black mb-2">{faq.q}</h3>
                                <p className="text-sm text-gray-700">{faq.a}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-primary-blue to-blue-600 rounded-2xl p-8 md:p-12 text-white">
                    <Crown className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to grow your business?</h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join hundreds of sellers already earning more with lower fees and premium features.
                    </p>
                    <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-primary-blue hover:bg-gray-100 font-bold"
                        onClick={() => handleSelectPlan("premium")}
                    >
                        Start Premium Trial
                    </Button>
                </div>
            </div>
        </div>
    );
}
