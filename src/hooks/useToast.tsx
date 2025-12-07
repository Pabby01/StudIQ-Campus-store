"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { ToastType } from "@/components/ui/Toast";

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration = 5000) => {
            const id = Math.random().toString(36).substring(7);
            setToasts((prev) => [...prev, { id, type, title, message, duration }]);
        },
        []
    );

    const success = useCallback(
        (title: string, message?: string) => showToast("success", title, message),
        [showToast]
    );

    const error = useCallback(
        (title: string, message?: string) => showToast("error", title, message),
        [showToast]
    );

    const info = useCallback(
        (title: string, message?: string) => showToast("info", title, message),
        [showToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => showToast("warning", title, message),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast {...toast} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
