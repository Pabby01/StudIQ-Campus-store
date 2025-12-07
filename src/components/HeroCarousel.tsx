"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

const slides = [
    {
        id: 1,
        title: "Campus Deals Extended!",
        subtitle: "Save up to 50% on electronics, books & more",
        cta: "Shop now",
        image: "/carousel_bg_1.png",
        link: "/search?category=Electronics",
    },
    {
        id: 2,
        title: "Pay with Solana",
        subtitle: "Fast, secure blockchain payments on campus",
        cta: "Learn more",
        image: "/carousel_bg_2.png",
        link: "/connect",
    },
    {
        id: 3,
        title: "New Arrivals",
        subtitle: "Fresh products from your favorite campus stores",
        cta: "Browse",
        image: "/carousel_bg_3.png",
        link: "/search",
    },
];

export default function HeroCarousel() {
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
        <div className="relative w-full h-[320px] md:h-[380px] overflow-hidden rounded-2xl">
            {/* Slides */}
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        className="min-w-full h-full relative flex items-center justify-center"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient Overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                        </div>

                        {/* Content with Glassmorphism */}
                        <div className="relative z-10 text-left px-8 md:px-16 max-w-2xl">
                            {/* Glass Card */}
                            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">
                                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                                    {slide.title}
                                </h2>
                                <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md">
                                    {slide.subtitle}
                                </p>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={() => (window.location.href = slide.link)}
                                    className="bg-white text-primary-blue hover:bg-gray-100 shadow-lg"
                                >
                                    {slide.cta}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all backdrop-blur-sm"
            >
                <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all backdrop-blur-sm"
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
