"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

const features = [
  {
    slug: "delivery",
    title: "Instant Campus Delivery",
    description: "Get essentials delivered in hours with real‑time tracking and reliable handoff.",
    image: "/tech.jpg",
    iconImage: "/tech.jpg",
    accent: "from-blue-100/80 via-white to-indigo-100/80",
    highlight: "Same‑day in major campuses",
  },
  {
    slug: "verified",
    title: "Verified Student Stores",
    description: "Shop trusted campus sellers with transparent ratings, reviews, and badges.",
    image: "/happy.jpg",
    iconImage: "/happy.jpg",
    accent: "from-emerald-100/80 via-white to-teal-100/80",
    highlight: "Community‑vetted sellers",
  },
  {
    slug: "payments",
    title: "Secure Wallet Payments",
    description: "Pay with Solana in seconds or choose flexible pay‑on‑delivery options.",
    image: "/carousel_bg_2.png",
    iconImage: "/carousel_bg_2.png",
    accent: "from-purple-100/80 via-white to-pink-100/80",
    highlight: "Fast, secure, modern",
  },
  {
    slug: "rewards",
    title: "Rewards & Cashback",
    description: "Earn points on every order and unlock perks crafted for campus life.",
    image: "/beat.jpg",
    iconImage: "/beat.jpg",
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
            return (
              <motion.div
                key={feature.slug}
                id={feature.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative overflow-hidden glass-card rounded-3xl border border-white/60 p-5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
                <div className="absolute inset-0">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-70"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[48%] backdrop-blur-lg bg-white/75" />
                <div className="relative z-10 flex flex-col gap-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-white/70 shadow-sm bg-white/70">
                      <Image
                        src={feature.iconImage}
                        alt={`${feature.title} icon`}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-primary-blue">{feature.highlight}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-black">{feature.title}</h2>
                    <p className="text-xs text-muted-text mt-1.5">{feature.description}</p>
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
