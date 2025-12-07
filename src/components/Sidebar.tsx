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
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-50 text-primary-blue"
                                    : "text-muted-text hover:bg-soft-gray-bg hover:text-black"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
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
