import { HTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    iconColor?: string;
}

export default function DashboardCard({
    title,
    value,
    icon: Icon,
    trend,
    iconColor = "text-primary-blue",
    className,
    ...props
}: DashboardCardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl border border-border-gray shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow w-full max-w-full",
                className
            )}
            {...props}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-text truncate">{title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-black break-words">{value}</p>
                    {trend && (
                        <p
                            className={cn(
                                "text-xs md:text-sm font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.isPositive ? "↑" : "↓"} {trend.value}
                        </p>
                    )}
                </div>
                <div className={cn("p-2 md:p-3 bg-blue-50 rounded-lg shrink-0", iconColor)}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            </div>
        </div>
    );
}
