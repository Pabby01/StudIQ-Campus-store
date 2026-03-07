/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Store, TrendingUp, Package, Trophy, HelpCircle, ArrowLeft, Bell, User, Search } from "lucide-react";
import { useUser } from "@civic/auth-web3/react";
import CivicAuthButton from "@/components/CivicAuthButton";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const { user } = useUser();
  const items = useCart((s) => s.items);
  const fetchSolPrice = useCart((s) => s.fetchSolPrice);
  const [isCompact, setIsCompact] = useState(false);

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
    <nav className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div
          className={`nav-glass border border-white/60 shadow-lg transition-all duration-300 ${
            isCompact ? "rounded-full px-4 sm:px-6 py-2" : "rounded-3xl px-4 sm:px-6 py-3"
          }`}
        >
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://i.postimg.cc/VNXWGB8P/logo.jpg"
                alt="StudIQ Campus Store Logo"
                className={`object-contain rounded-xl transition-all duration-300 ${isCompact ? "h-8 w-8" : "h-10 w-10"}`}
              />
              <span
                className={`font-bold text-black transition-all duration-300 hidden sm:block ${
                  isCompact ? "text-base" : "text-xl"
                }`}
              >
                StudIQ Campus Store
              </span>
            </Link>

            {!user && (
              <div className={`hidden md:flex items-center transition-all ${isCompact ? "gap-1" : "gap-2"}`}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isExternal = item.href.startsWith("http");

                  return isExternal ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`group flex flex-col items-center gap-1 rounded-2xl hover:bg-white/70 transition-all ${
                        isCompact ? "p-1.5" : "p-2"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                      <span
                        className={`text-xs font-medium text-muted-text group-hover:text-primary-blue absolute translate-y-8 ${
                          isCompact ? "hidden" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        }`}
                      >
                        {item.label}
                      </span>
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`group flex flex-col items-center gap-1 rounded-2xl hover:bg-white/70 transition-all ${
                        isCompact ? "p-1.5" : "p-2"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                      <span
                        className={`text-xs font-medium text-muted-text group-hover:text-primary-blue absolute translate-y-8 ${
                          isCompact ? "hidden" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className={`flex items-center transition-all ${isCompact ? "gap-2" : "gap-3"}`}>
            {user && (
              <>
                <Link
                  href="/dashboard/notifications"
                  className={`group flex flex-col items-center gap-1 rounded-2xl hover:bg-white/70 transition-all relative ${
                    isCompact ? "p-1.5" : "p-2"
                  }`}
                >
                  <div className="relative">
                    <Bell className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                    {/* Placeholder for unread count - we could use useNotifications() here but it might cause hydration mismatch if not handled carefully */}
                    {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-3 h-3 flex items-center justify-center"></span> */}
                  </div>
                  <span
                    className={`text-xs font-medium text-muted-text group-hover:text-primary-blue absolute translate-y-8 ${
                      isCompact ? "hidden" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    }`}
                  >
                    Alerts
                  </span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className={`group flex flex-col items-center gap-1 rounded-2xl hover:bg-white/70 transition-all ${
                    isCompact ? "p-1.5" : "p-2"
                  }`}
                >
                  <User className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                  <span
                    className={`text-xs font-medium text-muted-text group-hover:text-primary-blue absolute translate-y-8 ${
                      isCompact ? "hidden" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    }`}
                  >
                    Profile
                  </span>
                </Link>
              </>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className={`group relative hover:bg-white/70 rounded-2xl transition-all ${isCompact ? "p-1.5" : "p-2"}`}
            >
              <ShoppingCart className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user && (
              <div className={`transition-all ${isCompact ? "scale-95" : "scale-100"}`}>
                <CivicAuthButton />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <style jsx>{`
        .rotate-360 {
          transform: rotate(360deg);
        }
      `}</style>
    </nav>
  );
}
