"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

const features = [
  {
    slug: "delivery",
    title: "Instant Campus Delivery",
    description: "Get essentials delivered in hours with real‑time tracking and reliable handoff.",
    image: "/tech.jpg",
    iconImage: "/tech.jpg",
    accent: "from-slate-50 via-white to-slate-100",
    highlight: "Same‑day in major campuses",
  },
  {
    slug: "verified",
    title: "Verified Student Stores",
    description: "Shop trusted campus sellers with transparent ratings, reviews, and badges.",
    image: "/happy.jpg",
    iconImage: "/happy.jpg",
    accent: "from-slate-50 via-white to-slate-100",
    highlight: "Community‑vetted sellers",
  },
  {
    slug: "payments",
    title: "Secure Wallet Payments",
    description: "Pay with Solana in seconds or choose flexible pay‑on‑delivery options.",
    image: "/carousel_bg_2.png",
    iconImage: "/carousel_bg_2.png",
    accent: "from-slate-50 via-white to-slate-100",
    highlight: "Fast, secure, modern",
  },
  {
    slug: "rewards",
    title: "Rewards & Cashback",
    description: "Earn points on every order and unlock perks crafted for campus life.",
    image: "/beat.jpg",
    iconImage: "/beat.jpg",
    accent: "from-slate-50 via-white to-slate-100",
    highlight: "Stackable campus perks",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6 sm:space-y-8">
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 bg-white">
                <Sparkles className="w-4 h-4" />
                StudIQ Features
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 tracking-tight">
                Everything you need to shop smarter on campus
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-3 max-w-2xl">
                Premium features designed for students—faster delivery, trusted sellers, secure payments, and rewards built in.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/search" className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                Browse marketplace
              </Link>
              <Button variant="primary" className="bg-slate-900 hover:bg-slate-800" onClick={() => (window.location.href = "/dashboard")}>
                Get started
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">24/7</p>
            <p className="text-xs text-slate-500 mt-1">Support</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">10K+</p>
            <p className="text-xs text-slate-500 mt-1">Students</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">1K+</p>
            <p className="text-xs text-slate-500 mt-1">Stores</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">Fast</p>
            <p className="text-xs text-slate-500 mt-1">Checkout</p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {features.map((feature, index) => {
            return (
              <motion.div
                key={feature.slug}
                id={feature.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className={`relative h-36 sm:h-44 bg-gradient-to-br ${feature.accent}`}>
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-75"
                  />
                  <div className="absolute top-3 right-3 text-[10px] font-semibold text-slate-700 bg-white/85 border border-white rounded-full px-2 py-1">
                    {feature.highlight}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                      <Image
                        src={feature.iconImage}
                        alt={`${feature.title} icon`}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      Feature
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-slate-900 leading-tight">{feature.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">View details</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
