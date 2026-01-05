"use client";

import Link from "next/link";
import { Search, ShoppingCart, LayoutDashboard, Store, TrendingUp, Package, Trophy, HelpCircle, ArrowLeft } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const wallet = useWallet();
  const items = useCart((s) => s.items);

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
    <nav className="sticky top-0 z-50 bg-white border-b border-border-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://i.postimg.cc/VNXWGB8P/logo.jpg"
                alt="StudIQ Campus Store Logo"
                className="h-10 w-10 object-contain rounded-lg"
              />
              <span className="font-bold text-xl text-black hidden sm:block">
                StudIQ Campus Store
              </span>
            </Link>

            {/* Desktop Icon Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isExternal = item.href.startsWith('http');

                return isExternal ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-soft-gray-bg transition-all"
                  >
                    <Icon className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                    <span className="text-xs font-medium text-muted-text group-hover:text-primary-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute translate-y-8">
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-soft-gray-bg transition-all"
                  >
                    <Icon className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                    <span className="text-xs font-medium text-muted-text group-hover:text-primary-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute translate-y-8">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
              <input
                type="text"
                placeholder="Search products, stores..."
                className="w-full pl-10 pr-4 py-2 bg-soft-gray-bg border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.currentTarget.value;
                    if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }
                }}
              />
            </div>
          </div>

          {/* Right Side - Dashboard, Cart & Wallet */}
          <div className="flex items-center gap-3">
            {/* Dashboard Button (only when connected) */}
            {wallet.connected && (
              <Link
                href="/dashboard"
                className="group hidden sm:flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-soft-gray-bg transition-all"
              >
                <LayoutDashboard className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
                <span className="text-xs font-medium text-muted-text group-hover:text-primary-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute translate-y-8">
                  Dashboard
                </span>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="group relative p-2 hover:bg-soft-gray-bg rounded-lg transition-all">
              <ShoppingCart className="w-5 h-5 text-muted-text group-hover:text-primary-blue transition-all duration-500 group-hover:rotate-360" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Wallet Connection Button */}
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-soft-gray-bg border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = e.currentTarget.value;
                if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
              }
            }}
          />
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
