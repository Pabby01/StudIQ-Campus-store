import { HTMLAttributes, ReactNode } from "react";
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
                "bg-white rounded-xl border border-border-gray shadow-sm p-6 hover:shadow-md transition-shadow",
                className
            )}
            {...props}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-text">{title}</p>
                    <p className="text-3xl font-bold text-black">{value}</p>
                    {trend && (
                        <p
                            className={cn(
                                "text-sm font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.isPositive ? "↑" : "↓"} {trend.value}
                        </p>
                    )}
                </div>
                <div className={cn("p-3 bg-blue-50 rounded-lg", iconColor)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
