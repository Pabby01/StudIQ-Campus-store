/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Store,
    Package,
    ShoppingBag,
    Settings,
    Heart,
    Plus,
    X,
    Menu,
    Wallet,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type SidebarContentProps = {
    pathname: string | null;
    onNavigate?: () => void;
};

type NavLinkProps = {
    href: string;
    icon: any;
    label: string;
    activeMatch?: string;
    pathname: string | null;
    onNavigate?: () => void;
};

const NavLink = ({ href, icon: Icon, label, activeMatch, pathname, onNavigate }: NavLinkProps) => {
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");
    const active = activeMatch ? pathname === activeMatch : isActive(href);
    
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                "group flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200",
                active
                    ? "bg-white text-primary-blue shadow-sm border border-slate-100"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5 transition-colors", active ? "text-primary-blue" : "text-slate-400 group-hover:text-slate-600")} />
                <span>{label}</span>
            </div>
            {active && <ChevronRight className="w-4 h-4 text-primary-blue/40" />}
        </Link>
    );
};

function SidebarContent({ pathname, onNavigate }: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full">
            <nav className="flex-1 py-6 space-y-8 overflow-y-auto">
                <div>
                    <h3 className="px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Marketplace
                    </h3>
                    <div className="space-y-1">
                        <NavLink href="/dashboard" icon={LayoutDashboard} label="Overview" activeMatch="/dashboard" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/wallet" icon={Wallet} label="My Wallet" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/orders" icon={ShoppingBag} label="Purchases" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/wishlist" icon={Heart} label="Wishlist" pathname={pathname} onNavigate={onNavigate} />
                    </div>
                </div>

                <div>
                    <h3 className="px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Seller Tools
                    </h3>
                    <div className="space-y-1">
                        <NavLink href="/dashboard/store" icon={Store} label="My Store" activeMatch="/dashboard/store" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/products" icon={Package} label="Products" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/store/orders" icon={LayoutDashboard} label="Sales Orders" pathname={pathname} onNavigate={onNavigate} />
                        <NavLink href="/dashboard/settings" icon={Settings} label="Settings" pathname={pathname} onNavigate={onNavigate} />
                    </div>
                </div>
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
                    <h4 className="font-medium mb-1">Start Selling</h4>
                    <p className="text-xs text-slate-300 mb-3">Create your store and reach students.</p>
                    <Button
                        variant="primary"
                        className="w-full bg-white text-slate-900 hover:bg-slate-100 border-none h-9 text-sm"
                        onClick={() => window.location.href = "/dashboard/store"}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Store
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-20 left-4 z-[100] p-3 bg-white text-slate-900 border border-slate-200 rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="md:hidden fixed top-0 left-0 z-[70] w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-lg text-slate-900">Menu</h2>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <SidebarContent
                            pathname={pathname}
                            onNavigate={() => setIsMobileOpen(false)}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hidden md:flex w-64 fixed left-0 top-0 h-screen bg-slate-50/50 border-r border-slate-200/60 flex-col shrink-0 backdrop-blur-xl z-40"
            >
                <div className="flex flex-col flex-1 pt-24 w-full h-full">
                    <SidebarContent pathname={pathname} />
                </div>
            </motion.aside>
        </>
    );
}
