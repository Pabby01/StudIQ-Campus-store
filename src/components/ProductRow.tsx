"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import ProductCard from "./ProductCard";
import Link from "next/link";

type Product = Readonly<{
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
    rating?: number | null;
    category?: string;
}>;

interface ProductRowProps {
    title: string;
    subtitle?: string;
    products?: Product[]; // Make products optional or handle undefined (Flash Deals had no products initially in page.tsx splice?) - Wait, Flash Deals has products.
    // In page.tsx: products={products.slice(0, 8)...} is fine.
    // But Flash Deals in my previous edit:
    // <ProductRow title="Flash Deals" icon="Zap" /> -> This had NO products passed! That's a bug I introduced.
    // I need to fix that too.
    viewAllLink?: string;
    badgeText?: string;
    badgeColor?: string;
    icon?: React.ElementType; // Icon component type
}

export default function ProductRow({
    title,
    subtitle,
    products = [],
    viewAllLink,
    badgeText,
    badgeColor = "bg-black",
    icon: Icon, // Rename to Icon for rendering
}: ProductRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Icon className="w-6 h-6 text-primary-blue" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-black">{title}</h2>
                        {subtitle && <p className="text-sm text-muted-text mt-1">{subtitle}</p>}
                    </div>
                </div>
                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="text-primary-blue font-medium hover:underline text-sm"
                    >
                        View all
                    </Link>
                )}
            </div>

            {/* Scrollable Product Row */}
            <div className="relative group">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-border-gray rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-soft-gray-bg"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Products Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-[280px] relative">
                            {badgeText && (
                                <div
                                    className={`absolute top-3 left-3 z-10 ${badgeColor} text-white text-xs font-bold px-3 py-1 rounded`}
                                >
                                    {badgeText}
                                </div>
                            )}
                            <ProductCard p={product} />
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-border-gray rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-soft-gray-bg"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
