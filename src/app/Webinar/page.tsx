"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Calendar, Clock, Video, User, Mail, Wallet, Shield, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function WebinarPage() {
  const [formData, setFormData] = useState({ name: "", email: "", wallet_address: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");
      
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05051a] text-white selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header / Logos */}
        <div className="flex justify-center items-center gap-6 mb-12">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-semibold tracking-wide">StudIQ x Safestack</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Webinar Info */}
          <div className="space-y-8">
            <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400">
              Zero-Loss Dapps:<br />
              <span className="text-3xl sm:text-4xl text-blue-300 font-bold mt-2 block">Securing Capital on Solana</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
              Join industry leaders to discover how to build resilient, loss-proof decentralized applications on the fastest blockchain in the world.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="bg-blue-500/20 p-3 rounded-xl"><Calendar className="w-6 h-6 text-blue-400" /></div>
                <div>
                  <p className="text-sm text-gray-400">Date</p>
                  <p className="font-semibold">Fri 17, July 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="bg-purple-500/20 p-3 rounded-xl"><Clock className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <p className="text-sm text-gray-400">Time</p>
                  <p className="font-semibold">6:00 PM WAT</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 sm:col-span-2">
                <div className="bg-green-500/20 p-3 rounded-xl"><Video className="w-6 h-6 text-green-400" /></div>
                <div>
                  <p className="text-sm text-gray-400">Platform</p>
                  <p className="font-semibold">Google Meet (Link provided upon registration)</p>
                </div>
              </div>
            </div>

            {/* Speakers */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="text-xl font-bold">Featured Speakers</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-lg">NB</div>
                  <div>
                    <p className="font-bold text-sm">Nick Brons</p>
                    <p className="text-xs text-blue-400">Founder, Safestack AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-lg">SB</div>
                  <div>
                    <p className="font-bold text-sm">Sir_Barna</p>
                    <p className="text-xs text-purple-400">Moderator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-xl" />
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
              {success ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold">You're in!</h2>
                  <p className="text-gray-300">
                    Your seat has been reserved. We've sent the Google Meet link to your email.
                  </p>
                  <Button variant="outline" className="mt-8 text-black" onClick={() => window.location.href = '/'}>
                    Return Home
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">Reserve Your Seat</h2>
                  <p className="text-gray-400 mb-8">Spots are limited. Register now to secure your access.</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          required
                          className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          type="email"
                          required
                          className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">Solana Wallet Address <span className="text-gray-500 text-xs">(Optional)</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Wallet className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          placeholder="Enter your SOL address"
                          value={formData.wallet_address}
                          onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {errorMsg}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all transform hover:scale-[1.02]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Register Now"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
