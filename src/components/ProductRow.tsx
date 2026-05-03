"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { motion } from "framer-motion";

type Product = Readonly<{
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
    rating?: number | null;
    category?: string;
    badge?: string;
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

    const sectionVariants = {
        hidden: { opacity: 0, y: 18 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.45,
                ease: "easeOut" as const,
                staggerChildren: 0.06,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 14, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
                const scrollAmount = 240;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <motion.section
            className="glass-panel rounded-3xl p-3 sm:p-5 space-y-3.5 relative overflow-hidden"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <motion.div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-blue via-sky-400 to-fuchsia-400"
                animate={{ opacity: [0.45, 1, 0.45], x: ["-10%", "10%", "-10%"] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <motion.div
                            className="p-1.5 sm:p-2 bg-white/70 rounded-2xl border border-white/60"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                        >
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-blue" />
                        </motion.div>
                    )}
                    <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-black">{title}</h2>
                        {subtitle && <p className="text-xs sm:text-sm text-muted-text mt-1">{subtitle}</p>}
                    </div>
                </div>
                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="text-primary-blue font-medium text-[10px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full glass-pill hover:bg-white/90 transition-colors"
                    >
                        View all
                    </Link>
                )}
            </div>

            <div className="relative group z-10">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 glass-pill rounded-full items-center justify-center border border-white/60 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/90"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Products Container */}
                <div
                    ref={scrollRef}
                    className="grid grid-cols-2 gap-3 sm:flex sm:gap-3 sm:overflow-x-auto sm:scrollbar-hide sm:scroll-smooth sm:pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product) => {
                        const productBadge = product.badge ?? badgeText;
                        return (
                        <motion.div
                            key={product.id}
                            className="relative w-full sm:flex-shrink-0 sm:w-[165px] lg:w-[175px]"
                            variants={itemVariants}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {productBadge && (
                                <div
                                    className={`absolute top-2 left-2 z-10 ${badgeColor} text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}
                                >
                                    {productBadge}
                                </div>
                            )}
                            <ProductCard p={product} />
                        </motion.div>
                        );
                    })}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 glass-pill rounded-full items-center justify-center border border-white/60 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/90"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </motion.section>
    );
}
