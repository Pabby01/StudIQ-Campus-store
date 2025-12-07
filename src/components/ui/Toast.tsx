"use client";

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-600",
        title: "text-green-900",
        message: "text-green-700",
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "text-red-600",
        title: "text-red-900",
        message: "text-red-700",
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-600",
        title: "text-blue-900",
        message: "text-blue-700",
    },
    warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "text-yellow-600",
        title: "text-yellow-900",
        message: "text-yellow-700",
    },
};

export default function Toast({
    id,
    type,
    title,
    message,
    duration = 5000,
    onClose,
}: ToastProps) {
    const Icon = icons[type];
    const colorScheme = colors[type];

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    return (
        <div
            className={`${colorScheme.bg} ${colorScheme.border} border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md animate-fade-in`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${colorScheme.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <p className={`font-medium ${colorScheme.title} text-sm`}>{title}</p>
                    {message && (
                        <p className={`${colorScheme.message} text-sm mt-1`}>{message}</p>
                    )}
                </div>
                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
