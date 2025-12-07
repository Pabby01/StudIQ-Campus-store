import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                primary: "bg-primary-blue text-white hover:bg-accent-blue focus:ring-primary-blue shadow-sm hover:shadow-md",
                secondary: "bg-white text-primary-blue border-2 border-primary-blue hover:bg-soft-gray-bg focus:ring-primary-blue",
                outline: "bg-transparent border border-border-gray text-black hover:bg-soft-gray-bg focus:ring-border-gray",
                ghost: "bg-transparent text-black hover:bg-soft-gray-bg focus:ring-border-gray",
                danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
            },
            size: {
                sm: "px-3 py-1.5 text-sm",
                md: "px-4 py-2.5 text-base",
                lg: "px-6 py-3 text-lg",
                xl: "px-8 py-4 text-xl",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export default Button;
