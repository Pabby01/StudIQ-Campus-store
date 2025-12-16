"use client";

import { Check, Crown, Zap, Store } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface PricingCardProps {
    name: string;
    displayName: string;
    price: number;
    feePercentage: number;
    maxStores?: number;
    features: string[];
    popular?: boolean;
    buttonText: string;
    onSelect: () => void;
}

export default function PricingCard({
    name,
    displayName,
    price,
    feePercentage,
    maxStores,
    features,
    popular = false,
    buttonText,
    onSelect
}: PricingCardProps) {
    const isPremium = name === "premium";
    const isFree = name === "free";

    return (
        <Card
            className={`relative p-6 md:p-8 flex flex-col h-full ${popular ? 'border-2 border-primary-blue shadow-xl scale-105' : ''
                }`}
        >
            {popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-blue text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        MOST POPULAR
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                {maxStores && (
                    <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                        <Store className="w-5 h-5 text-primary-blue" />
                        <span className="text-xl font-bold text-primary-blue">{maxStores}</span>
                        <span className="text-sm font-medium text-gray-700">
                            {maxStores === 1 ? 'Store' : 'Stores'}
                        </span>
                    </div>
                )}
                <h3 className="text-2xl font-bold text-black mb-2 flex items-center justify-center gap-2">
                    {displayName}
                    {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
                </h3>
                <div className="mb-4">
                    <span className="text-4xl md:text-5xl font-bold text-black">
                        ${price}
                    </span>
                    <span className="text-muted-text ml-2">/month</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-green-50 rounded-full">
                    <span className="text-sm font-semibold text-green-700">
                        {feePercentage}% platform fee
                    </span>
                </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={popular ? "primary" : isFree ? "outline" : "secondary"}
                className="w-full min-h-[48px] font-semibold text-base"
                onClick={onSelect}
            >
                {buttonText}
            </Button>

            {!isFree && (
                <p className="text-xs text-muted-text text-center mt-3">
                    Cancel anytime
                </p>
            )}
        </Card>
    );
}
