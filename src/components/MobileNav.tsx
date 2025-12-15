"use client";

import { Home, LayoutDashboard, ShoppingCart, Package, User, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/store/cart";

export default function MobileNav() {
    const pathname = usePathname();
    const cart = useCart();
    const itemCount = cart.items.length;

    const tabs = [
        { icon: Home, label: "Home", href: "/", match: "/" },
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", match: "/dashboard" },
        { icon: TrendingUp, label: "Predict", href: "/prediction", match: "/prediction" },
        { icon: Package, label: "Track", href: "/track", match: "/track" },
        { icon: User, label: "Profile", href: "/dashboard/settings", match: "/dashboard/settings" }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
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
                            <div className="relative">
                                <Icon className="w-6 h-6" />
                                {/* Only show badge if count > 0 */}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </span>
                                )}
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
