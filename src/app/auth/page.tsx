"use client";

import CivicAuthButton from "@/components/CivicAuthButton";
import { ShoppingBag, Store, Trophy, Gift } from "lucide-react";

const perks = [
  {
    icon: Gift,
    title: "Earn 150 Points Instantly",
    desc: "Get a welcome bonus the moment you complete your profile.",
    color: "text-yellow-500 bg-yellow-50",
  },
  {
    icon: ShoppingBag,
    title: "Shop Campus Essentials",
    desc: "Textbooks, gadgets, food & more — all from verified student sellers.",
    color: "text-blue-500 bg-blue-50",
  },
  {
    icon: Store,
    title: "Open Your Own Store",
    desc: "Start selling in minutes. Get paid in crypto or cash on delivery.",
    color: "text-green-500 bg-green-50",
  },
  {
    icon: Trophy,
    title: "Climb the Leaderboard",
    desc: "Earn points for every order. Top students unlock exclusive rewards.",
    color: "text-purple-500 bg-purple-50",
  },
];

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center">

        {/* Left — value prop */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Built for Nigerian Campus Students
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              Your Campus.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Your Marketplace.
              </span>
            </h1>
            <p className="mt-3 text-slate-500 text-base max-w-sm mx-auto lg:mx-0">
              Buy, sell, and earn with StudIQ — the trusted decentralised marketplace for campus life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perks.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sign-in card */}
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 text-center">
          <div>
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-xl">SQ</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Join StudIQ</h2>
            <p className="text-sm text-slate-400 mt-1">
              Sign in with your Civic account to get started in seconds.
            </p>
          </div>

          <div className="flex justify-center">
            <CivicAuthButton />
          </div>

          <p className="text-xs text-slate-300">
            No passwords. Powered by Civic Auth &amp; Solana.
          </p>
        </div>
      </div>
    </div>
  );
}
