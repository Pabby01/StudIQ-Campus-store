"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Dialog({ isOpen, onClose, title, children, footer }: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            if (dialog.open) {
                dialog.close();
            }
        }
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <dialog
            ref={dialogRef}
            className="backdrop:bg-black/40 backdrop:backdrop-blur-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-0 w-[95%] max-w-md m-auto animate-in fade-in zoom-in-95 duration-200 border border-white/20 overflow-hidden"
            onClick={handleBackdropClick}
            onClose={onClose}
        >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/50">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-900 transition-all p-2 rounded-full hover:bg-gray-100 active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
                {children}
            </div>

            {footer && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    {footer}
                </div>
            )}
        </dialog>
    );
}
