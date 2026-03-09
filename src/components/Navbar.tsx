/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Store, TrendingUp, Package, Trophy, HelpCircle, ArrowLeft, Bell, User, Search, LayoutDashboard } from "lucide-react";
import { useUser } from "@civic/auth-web3/react";
import CivicAuthButton from "@/components/CivicAuthButton";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const items = useCart((s) => s.items);
  const fetchSolPrice = useCart((s) => s.fetchSolPrice);
  const [isCompact, setIsCompact] = useState(false);
  const avatarUrl =
    (user as { picture?: string; image?: string; avatar?: string } | null)?.picture ||
    (user as { picture?: string; image?: string; avatar?: string } | null)?.image ||
    (user as { picture?: string; image?: string; avatar?: string } | null)?.avatar ||
    null;

  // Pre-fetch SOL price on mount to warm cache for checkout
  useEffect(() => {
    fetchSolPrice();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const navItems = [
    { href: "https://www.studiq.fun", icon: ArrowLeft, label: "StudIQ" },
    { href: "/search", icon: Search, label: "Browse" },
    { href: "/stores", icon: Store, label: "Stores" },
    { href: "/prediction", icon: TrendingUp, label: "Predictions" },
    { href: "/track", icon: Package, label: "Track" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { href: "/faq", icon: HelpCircle, label: "FAQ" },
  ];

  return (
    <nav className="sticky top-0 z-50 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 bg-white/80 backdrop-blur-md border border-white/60 shadow-sm rounded-full px-6 transition-all duration-300">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                <img
                  src="https://i.postimg.cc/VNXWGB8P/logo.jpg"
                  alt="StudIQ Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block group-hover:text-primary-blue transition-colors">
                StudIQ
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-blue hover:bg-slate-50 rounded-full transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search (Mobile/Tablet Icon only, Desktop Expanded) */}
            <div className="relative hidden lg:block w-64">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-blue/20 focus:bg-white transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = e.currentTarget.value;
                    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
                  }
                }}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            
            <Link href="/search" className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-600 hover:text-primary-blue hover:bg-slate-100 rounded-full transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary-blue text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="p-2 text-slate-600 hover:text-primary-blue hover:bg-slate-100 rounded-full transition-all duration-200"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>

                <Link
                  href="/dashboard/notifications"
                  className="p-2 text-slate-600 hover:text-primary-blue hover:bg-slate-100 rounded-full transition-all duration-200 relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="p-2 text-slate-600 hover:text-primary-blue hover:bg-slate-100 rounded-full transition-all duration-200"
                  title="Settings"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-5 h-5 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Link>
              </>
            )}

            {/* Auth Button / User Profile */}
            <div className="pl-2 border-l border-slate-200">
               <CivicAuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
