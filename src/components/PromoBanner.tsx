import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PromoBannerProps {
    title: string;
    subtitle?: string;
    ctaText: string;
    ctaLink: string;
    bgColor?: string;
    textColor?: string;
    image?: string;
}

export default function PromoBanner({
    title,
    subtitle,
    ctaText,
    ctaLink,
    bgColor = "bg-gradient-to-r from-green-600 to-green-700",
    textColor = "text-white",
    image,
}: PromoBannerProps) {
    return (
        <Link href={ctaLink}>
            <div
                className={`relative ${bgColor} ${textColor} rounded-xl overflow-hidden h-[280px] group hover:shadow-lg transition-shadow`}
            >
                {image && (
                    <div className="absolute inset-0 opacity-20">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="relative h-full p-8 flex flex-col justify-between">
                    <div>
                        <h3 className="text-3xl font-bold mb-2">{title}</h3>
                        {subtitle && <p className="text-lg opacity-90">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2 font-medium group-hover:gap-3 transition-all">
                        <span>{ctaText}</span>
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
