"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string; // e.g. w-[420px]
}

export default function SidePanel({ isOpen, onClose, title, children, width = "w-[420px]" }: SidePanelProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Position the panel to the right side of the centered modal/dialog.
  // Assumes the modal is centered and has a width around 480px (max-w-md).
  // We place the panel using viewport math similar to Stripe/paystack: left: calc(50% + 240px + 12px)
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* click catcher to close if user clicks outside both modal and panel; keep pointer-events to allow close */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      <aside
        className={`pointer-events-auto fixed top-1/2 transform -translate-y-1/2 ${width} bg-white/95 border border-white/20 shadow-2xl rounded-2xl right-auto`
        style={{ left: "calc(50% + 260px)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </aside>
    </div>
  );
}
