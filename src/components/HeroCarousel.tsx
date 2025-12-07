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
        bgColor: "from-blue-600 to-blue-800",
        link: "/search?category=Electronics",
    },
    {
        id: 2,
        title: "Pay with Solana",
        subtitle: "Fast, secure blockchain payments on campus",
        cta: "Learn more",
        bgColor: "from-purple-600 to-purple-800",
        link: "/connect",
    },
    {
        id: 3,
        title: "New Arrivals",
        subtitle: "Fresh products from your favorite campus stores",
        cta: "Browse",
        bgColor: "from-green-600 to-green-800",
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
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-primary-blue to-accent-blue">
            {/* Slides */}
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        className={`min-w-full h-full flex items-center justify-center bg-gradient-to-br ${slide.bgColor}`}
                    >
                        <div className="text-center text-white px-4 max-w-3xl">
                            <h2 className="text-4xl md:text-6xl font-bold mb-4">{slide.title}</h2>
                            <p className="text-xl md:text-2xl mb-8 opacity-90">{slide.subtitle}</p>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => (window.location.href = slide.link)}
                            >
                                {slide.cta}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
                <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
                <ChevronRight className="w-6 h-6 text-black" />
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
                        className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? "bg-white w-8" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
