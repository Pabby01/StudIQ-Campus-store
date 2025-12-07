import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white rounded-xl border border-border-gray shadow-sm p-6",
                    hover && "transition-shadow duration-200 hover:shadow-md cursor-pointer",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

export default Card;
