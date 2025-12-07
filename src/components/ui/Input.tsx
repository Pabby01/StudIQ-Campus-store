import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-black mb-2">
                        {label}
                    </label>
                )}
                <input
                    className={cn(
                        "w-full px-4 py-2.5 bg-white border border-border-gray rounded-lg text-black placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-200",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
