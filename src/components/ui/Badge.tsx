import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    {
        variants: {
            variant: {
                blue: "bg-blue-100 text-primary-blue",
                gray: "bg-gray-100 text-muted-text",
                green: "bg-green-100 text-green-700",
                yellow: "bg-yellow-100 text-yellow-700",
                red: "bg-red-100 text-red-700",
            },
        },
        defaultVariants: {
            variant: "blue",
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(badgeVariants({ variant, className }))}
                {...props}
            />
        );
    }
);

Badge.displayName = "Badge";

export default Badge;
