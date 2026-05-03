"use client";

import { motion } from "framer-motion";
import { Package, Sparkles, ShoppingCart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(76,88,140,0.14)] backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 via-transparent to-fuchsia-500/10" />
        <div className="relative flex flex-col items-center text-center">
          <motion.div
            className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-blue via-sky-500 to-indigo-500 text-white shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          >
            <Package className="h-8 w-8" />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/70"
              animate={{ scale: [1, 1.12, 1], opacity: [0.8, 0.45, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.h1
            className="text-2xl font-bold text-slate-950"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Loading StudIQ
          </motion.h1>
          <p className="mt-2 text-sm text-slate-500">Bringing your campus marketplace to life...</p>

          <div className="mt-8 flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-3 w-3 rounded-full bg-primary-blue"
                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.1, delay: index * 0.16 }}
              />
            ))}
          </div>

          <div className="mt-8 grid w-full gap-3">
            {[
              { icon: Sparkles, label: "Refreshing products" },
              { icon: ShoppingCart, label: "Preparing your cart" },
              { icon: Package, label: "Loading fresh deals" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-left shadow-sm"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.12 }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-blue via-sky-500 to-indigo-500"
                      initial={{ width: "20%" }}
                      animate={{ width: ["20%", "85%", "45%", "92%"] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{item.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
