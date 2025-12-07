"use client";

import Link from "next/link";
import { Search, ShoppingCart, Wallet, LayoutDashboard } from "lucide-react";
import { useWalletConnection, useWallet, useConnectWallet, useDisconnectWallet } from "@solana/react-hooks";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useCart } from "@/store/cart";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const wallet = useWallet();
  const { connectors } = useWalletConnection();
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const auth = useWalletAuth();
  const items = useCart((s) => s.items);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl text-black hidden sm:block">
                StudIQ Campus Store
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/search"
                className="text-sm font-medium text-muted-text hover:text-primary-blue transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/stores"
                className="text-sm font-medium text-muted-text hover:text-primary-blue transition-colors"
              >
                Stores
              </Link>
              <Link
                href="/prediction"
                className="text-sm font-medium text-muted-text hover:text-primary-blue transition-colors"
              >
                Predictions
              </Link>
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
            {wallet.status === "connected" && (
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-soft-gray-bg rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-black" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Wallet Connection */}
            {wallet.status === "connected" ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-soft-gray-bg rounded-lg">
                  <Wallet className="w-4 h-4 text-primary-blue" />
                  <span className="text-xs font-medium text-black">
                    {auth.address?.slice(0, 4)}...{auth.address?.slice(-4)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void disconnect()}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {connectors.slice(0, 1).map((c) => (
                  <Button
                    key={c.id}
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      await connect(c.id);
                      window.location.href = "/connect";
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                ))}
              </div>
            )}
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
    </nav>
  );
}
