import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
}

export default function PremiumBadge({
    className,
    size = "md",
    showIcon = true
}: PremiumBadgeProps) {
    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm"
    };

    const iconSizes = {
        sm: "w-2.5 h-2.5",
        md: "w-3 h-3",
        lg: "w-4 h-4"
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white font-bold shadow-sm",
                sizeClasses[size],
                className
            )}
        >
            {showIcon && <Crown className={iconSizes[size]} />}
            PREMIUM
        </span>
    );
}
