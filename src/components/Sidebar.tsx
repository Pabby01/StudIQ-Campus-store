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
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

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

    return (
        <aside className="w-64 bg-white border-r border-border-gray min-h-screen flex flex-col">
            {/* Navigation Links */}
            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">

                {/* Buying Section */}
                <div>
                    <h3 className="px-4 text-xs font-semibold text-muted-text uppercase tracking-wider mb-2">
                        Buying
                    </h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </Link>
                        <Link
                            href="/dashboard/orders"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard/orders"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            My Purchases
                        </Link>
                        <Link
                            href="/dashboard/wishlist"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard/wishlist"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <Heart className="w-5 h-5" />
                            Wishlist
                        </Link>
                    </div>
                </div>

                {/* Selling Section */}
                <div>
                    <h3 className="px-4 text-xs font-semibold text-muted-text uppercase tracking-wider mb-2">
                        Selling
                    </h3>
                    <div className="space-y-1">
                        <Link
                            href="/dashboard/store"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard/store"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <Store className="w-5 h-5" />
                            My Store
                        </Link>
                        <Link
                            href="/dashboard/products"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname?.startsWith("/dashboard/products")
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <Package className="w-5 h-5" />
                            Products
                        </Link>
                        <Link
                            href="/dashboard/store/orders"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard/store/orders"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Sales Orders
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                pathname === "/dashboard/settings"
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <Settings className="w-5 h-5" />
                            Settings
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Create Store CTA */}
            <div className="p-4 border-t border-border-gray">
                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => window.location.href = "/dashboard/store"}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create a Store
                </Button>
            </div>
        </aside>
    );
}
