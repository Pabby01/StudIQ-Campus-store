/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import {
  LayoutDashboard,
  Package,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Bell
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { walletAddress, isLoading, isAuthenticated } = useCivicWallet();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check admin verification
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-white/70 mb-6">Enter your access code to continue</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError("");

                // Validate access code
                const validCode = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE || "202425";
                if (accessCode === validCode) {
                  setIsVerified(true);
                  sessionStorage.setItem("admin_verified", "true");
                } else {
                  setError("Invalid access code");
                }
                setLoading(false);
              }}
              className="space-y-4"
            >
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-500 transition-colors"
              />

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Access Dashboard"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Featured Stores",
      href: "/admin/featured-stores",
      icon: <Star className="w-5 h-5" />,
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        { label: "Overview", href: "/admin/analytics/overview", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Users", href: "/admin/analytics/users", icon: <Users className="w-4 h-4" /> },
        { label: "Orders", href: "/admin/analytics/orders", icon: <ShoppingCart className="w-4 h-4" /> },
        { label: "Revenue", href: "/admin/analytics/revenue", icon: <DollarSign className="w-4 h-4" /> },
      ],
    },
    {
      label: "Stores",
      href: "/admin/stores",
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4">Admin</h1>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || mobileOpen) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-xl z-40 lg:z-30 ${
              mobileOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  StudIQ Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">Professional Dashboard</p>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navItems.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                        isActive(item.href)
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex-shrink-0">{item.icon}</div>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500">
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Submenu */}
                    {item.children && isActive(item.href) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 ml-2 space-y-1"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                              isActive(child.href)
                                ? "bg-blue-500/20 text-blue-300"
                                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="flex-shrink-0">{child.icon}</div>
                            <span className="font-medium">{child.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="border-t border-slate-800 p-4 space-y-2">
                <div className="text-xs text-slate-400 px-4 py-2">
                  <p className="font-semibold text-slate-300">Wallet</p>
                  <p className="truncate mt-1">{walletAddress?.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.removeItem("admin_verified");
                    setIsVerified(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : ""}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
