/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Home, LayoutDashboard, ShoppingCart, Package, User, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
    const pathname = usePathname();
    const tabs = [
        { icon: Home, label: "Home", href: "/", match: "/" },
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", match: "/dashboard" },
        { icon: TrendingUp, label: "Predict", href: "/prediction", match: "/prediction" },
        { icon: Package, label: "Track", href: "/track", match: "/track" },
        { icon: Trophy, label: "Board", href: "/leaderboard", match: "/leaderboard" },
        { icon: User, label: "Profile", href: "/dashboard/settings", match: "/dashboard/settings" }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/40 z-50 safe-area-inset-bottom shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex justify-around items-center h-16 px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.match || pathname.startsWith(tab.match + '/');
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${isActive ? 'text-primary-blue' : 'text-gray-500'
                                }`}
                        >
                            <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? "bg-primary-blue/10" : "bg-transparent"}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary-blue' : 'text-gray-600'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
