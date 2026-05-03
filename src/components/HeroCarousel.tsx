"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

const slides = [
    {
        id: 1,
        title: "Flash Deal: Campus Tech Week",
        subtitle: "Up to 60% off new smartphones & accessories",
        cta: "Shop deal",
        image: "/tech.jpg",
        badge: "Limited time",
        accent: "from-indigo-100 via-white to-blue-100",
        link: "/search?category=Electronics",
    },
    {
        id: 2,
        title: "Flash Deal: Study Beats",
        subtitle: "Noise‑canceling headphones from ₦9,999",
        cta: "Grab now",
        image: "/beat.jpg",
        badge: "Hot pick",
        accent: "from-purple-100 via-white to-pink-100",
        link: "/search?category=Electronics",
    },
    {
        id: 3,
        title: "Flash Deal: Sneaker Drops",
        subtitle: "Fresh kicks for campus, up to 40% off",
        cta: "View drops",
        image: "/happy.jpg",
        badge: "Just landed",
        accent: "from-emerald-100 via-white to-teal-100",
        link: "/search?category=Fashion%20%26%20Clothing",
    },
];

export default function HeroCarousel() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAutoPlaying(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlaying(false);
    };

    return (
        <div className="relative w-full h-[320px] md:h-[380px] overflow-hidden rounded-3xl">
            {/* Slides */}
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <motion.div
                        key={slide.id}
                        className="min-w-full h-full relative flex items-center justify-center"
                        whileHover={{ scale: 1.005 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`} />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_55%)]" />

                        <div className="relative z-10 grid h-full w-full grid-cols-1 md:grid-cols-12 gap-6 px-6 md:px-12 py-8">
                            <div className="md:col-span-6 flex flex-col justify-center">
                                <div className="inline-flex w-fit items-center gap-2 rounded-full glass-pill px-3 py-1 text-xs font-semibold text-primary-blue">
                                    {slide.badge}
                                </div>
                                <h2 className="mt-4 text-3xl md:text-5xl font-bold text-black">
                                    {slide.title}
                                </h2>
                                <p className="mt-3 text-base md:text-lg text-muted-text max-w-md">
                                    {slide.subtitle}
                                </p>
                            </div>
                            <div className="md:col-span-6 flex items-center justify-center">
                                <motion.div
                                    className="relative w-full max-w-[520px] h-[220px] md:h-[300px]"
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    <Image
                                        src={slide.image}
                                        alt={slide.title}
                                        fill
                                        sizes="(min-width: 768px) 50vw, 90vw"
                                        className="object-cover rounded-[32px] shadow-2xl transition-transform duration-500"
                                        priority={slide.id === 1}
                                    />
                                </motion.div>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(slide.link)}
                            className="absolute bottom-5 left-5 rounded-full bg-white/90 text-primary-blue hover:bg-white shadow-md"
                        >
                            {slide.cta}
                        </Button>
                    </motion.div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-pill rounded-full flex items-center justify-center border border-white/60 shadow-lg transition-all hover:bg-white/90"
            >
                <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-pill rounded-full flex items-center justify-center border border-white/60 shadow-lg transition-all hover:bg-white/90"
            >
                <ChevronRight className="w-5 h-5 text-black" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setCurrentSlide(index);
                            setIsAutoPlaying(false);
                        }}
                        className={`h-2 rounded-full transition-all ${index === currentSlide
                                ? "bg-white w-8"
                                : "bg-white/50 w-2 hover:bg-white/75"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
