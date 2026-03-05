"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, BadgeCheck, ShieldCheck, Coins, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

const features = [
  {
    slug: "delivery",
    title: "Instant Campus Delivery",
    description: "Get essentials delivered in hours with real‑time tracking and reliable handoff.",
    image: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?auto=format&fit=crop&w=1400&q=80",
    icon: Rocket,
    accent: "from-blue-100/80 via-white to-indigo-100/80",
    highlight: "Same‑day in major campuses",
  },
  {
    slug: "verified",
    title: "Verified Student Stores",
    description: "Shop trusted campus sellers with transparent ratings, reviews, and badges.",
    image: "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80",
    icon: BadgeCheck,
    accent: "from-emerald-100/80 via-white to-teal-100/80",
    highlight: "Community‑vetted sellers",
  },
  {
    slug: "payments",
    title: "Secure Wallet Payments",
    description: "Pay with Solana in seconds or choose flexible pay‑on‑delivery options.",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80",
    icon: ShieldCheck,
    accent: "from-purple-100/80 via-white to-pink-100/80",
    highlight: "Fast, secure, modern",
  },
  {
    slug: "rewards",
    title: "Rewards & Cashback",
    description: "Earn points on every order and unlock perks crafted for campus life.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    icon: Coins,
    accent: "from-amber-100/80 via-white to-orange-100/80",
    highlight: "Stackable campus perks",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 glass-pill rounded-full px-3 py-1 text-xs font-semibold text-primary-blue">
                <Sparkles className="w-4 h-4" />
                StudIQ Features
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mt-4">
                Everything you need to shop smarter on campus
              </h1>
              <p className="text-sm sm:text-base text-muted-text mt-3 max-w-2xl">
                Premium features designed for students—faster delivery, trusted sellers, secure payments, and rewards built in.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/search" className="glass-pill rounded-full px-4 py-2 text-xs font-semibold text-primary-blue">
                Browse marketplace
              </Link>
              <Button variant="primary" onClick={() => (window.location.href = "/dashboard")}>
                Get started
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.slug}
                id={feature.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative overflow-hidden glass-card rounded-3xl border border-white/60 p-6"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
                <div className="absolute inset-0">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-20"
                  />
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-blue" />
                    </div>
                    <span className="text-xs font-semibold text-primary-blue">{feature.highlight}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-black">{feature.title}</h2>
                    <p className="text-sm text-muted-text mt-2">{feature.description}</p>
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
