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
            className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-white rounded-xl shadow-2xl p-0 w-full max-w-md m-auto animate-fade-in open:flex open:flex-col"
            onClick={handleBackdropClick}
            onClose={onClose}
        >
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
                {children}
            </div>

            {footer && (
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    {footer}
                </div>
            )}
        </dialog>
    );
}
