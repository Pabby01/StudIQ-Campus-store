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
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Store", href: "/dashboard/store", icon: Store },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const SidebarContent = () => (
        <>
            <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto relative z-10">
                <div>
                    <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Buying
                    </h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </Link>
                        <Link
                            href="/dashboard/wallet"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/wallet"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <Wallet className="w-5 h-5" />
                            My Wallet
                        </Link>
                        <Link
                            href="/dashboard/orders"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/orders"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            My Purchases
                        </Link>
                        <Link
                            href="/dashboard/wishlist"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/wishlist"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <Heart className="w-5 h-5" />
                            Wishlist
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Selling
                    </h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard/store"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/store"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <Store className="w-5 h-5" />
                            My Store
                        </Link>
                        <Link
                            href="/dashboard/products"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname?.startsWith("/dashboard/products")
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <Package className="w-5 h-5" />
                            Products
                        </Link>
                        <Link
                            href="/dashboard/store/orders"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/store/orders"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Sales Orders
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                                pathname === "/dashboard/settings"
                                    ? "bg-white text-slate-900 shadow-sm border border-white/70"
                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <Settings className="w-5 h-5" />
                            Settings
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-white/60 relative z-10">
                <Button
                    variant="primary"
                    className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800"
                    onClick={() => window.location.href = "/dashboard/store"}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create a Store
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button - ALWAYS VISIBLE ON TOP */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-20 left-4 z-[100] p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors"
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
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar - Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        id="mobile-sidebar"
                        className="md:hidden fixed top-0 left-0 z-[70] w-72 h-full bg-white/90 border-r border-white/70 flex flex-col shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/70">
                            <h2 className="font-semibold text-lg text-slate-900">Menu</h2>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="p-2 hover:bg-white/70 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <SidebarContent />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Always Visible */}
            <motion.aside
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hidden md:flex w-64 fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white/80 border-r border-white/60 flex-col shrink-0 backdrop-blur-xl shadow-xl rounded-r-3xl relative"
            >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/60 via-white/20 to-transparent" />
                <SidebarContent />
            </motion.aside>
        </>
    );
}
