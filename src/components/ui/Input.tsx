import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    description?: string;
    suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, description, suffix, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-black mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        className={cn(
                            "w-full px-4 py-2.5 glass-pill rounded-2xl text-black placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-200",
                            suffix && "pr-12",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-sm font-bold text-gray-400">{suffix}</span>
                        </div>
                    )}
                </div>
                {description && (
                    <p className="mt-1 text-xs text-muted-text">{description}</p>
                )}
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
