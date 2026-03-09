/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Home, LayoutDashboard, ShoppingCart, Package, User, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function MobileNav() {
    const pathname = usePathname();
    const tabs = [
        { icon: Home, label: "Home", href: "/", match: "/" },
        { icon: LayoutDashboard, label: "Dash", href: "/dashboard", match: "/dashboard" },
        { icon: TrendingUp, label: "Predict", href: "/prediction", match: "/prediction" },
        { icon: Trophy, label: "Board", href: "/leaderboard", match: "/leaderboard" },
        { icon: Package, label: "Track", href: "/track", match: "/track" },
        { icon: User, label: "Profile", href: "/dashboard/settings", match: "/dashboard/settings" }
    ];

    return (
        <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] px-1 py-2">
                <ul className="flex justify-between items-center relative">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.match || (tab.match !== '/' && pathname.startsWith(tab.match));
                        const Icon = tab.icon;

                        return (
                            <li key={tab.href} className="flex-1 relative z-10">
                                <Link
                                    href={tab.href}
                                    className="flex flex-col items-center justify-center py-2 relative w-full h-full group"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-tab"
                                            className="absolute inset-0 bg-slate-900 rounded-[1.5rem]"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    
                                    <span className="relative z-10 flex flex-col items-center gap-1">
                                        <Icon 
                                            className={`w-6 h-6 transition-all duration-300 ${
                                                isActive ? 'text-white translate-y-0' : 'text-slate-400 group-hover:text-slate-600'
                                            }`} 
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                        <span className={`text-[10px] font-semibold transition-all duration-300 ${
                                            isActive ? 'text-white opacity-100' : 'text-slate-400 opacity-0 h-0 overflow-hidden'
                                        }`}>
                                            {tab.label}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
