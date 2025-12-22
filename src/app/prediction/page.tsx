"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Lock } from "lucide-react";

// Demo prediction markets data
const DEMO_MARKETS = [
  {
    id: 1,
    question: "Will Bitcoin reach $100,000 by end of Q1 2025?",
    category: "Crypto",
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 45.8,
    participants: 127,
    deadline: "2025-03-31",
    trending: true,
  },
  {
    id: 2,
    question: "Will the next iPhone feature satellite connectivity?",
    category: "Technology",
    yesPrice: 0.42,
    noPrice: 0.58,
    totalVolume: 28.3,
    participants: 89,
    deadline: "2025-09-15",
    trending: false,
  },
  {
    id: 3,
    question: "Will any Web3 game reach 10M active users in 2025?",
    category: "Gaming",
    yesPrice: 0.71,
    noPrice: 0.29,
    totalVolume: 62.1,
    participants: 203,
    deadline: "2025-12-31",
    trending: true,
  },
  {
    id: 4,
    question: "Will Solana TVL surpass Ethereum TVL this year?",
    category: "DeFi",
    yesPrice: 0.18,
    noPrice: 0.82,
    totalVolume: 91.4,
    participants: 312,
    deadline: "2025-12-31",
    trending: true,
  },
  {
    id: 5,
    question: "Will a major university accept crypto for tuition by 2026?",
    category: "Education",
    yesPrice: 0.55,
    noPrice: 0.45,
    totalVolume: 19.7,
    participants: 67,
    deadline: "2026-01-01",
    trending: false,
  },
  {
    id: 6,
    question: "Will NFT marketplace volume recover to 2021 levels?",
    category: "NFTs",
    yesPrice: 0.33,
    noPrice: 0.67,
    totalVolume: 37.2,
    participants: 145,
    deadline: "2025-06-30",
    trending: false,
  },
];

export default function PredictionPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Crypto", "Technology", "Gaming", "DeFi", "Education", "NFTs"];

  const filteredMarkets = selectedCategory === "All"
    ? DEMO_MARKETS
    : DEMO_MARKETS.filter(m => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-soft-gray-bg p-4 md:p-8 relative">
      {/* Blurred Content */}
      <div className="blur-sm pointer-events-none select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-primary-blue" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">Prediction Markets</h1>
              <p className="text-muted-text mt-1">Trade on future events and outcomes</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-text">Active Markets</p>
                  <p className="text-2xl font-bold text-black mt-1">24</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-text">Total Volume</p>
                  <p className="text-2xl font-bold text-black mt-1">284.5 SOL</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-text">Participants</p>
                  <p className="text-2xl font-bold text-black mt-1">1,243</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-text">24h Volume</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">+18.2%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </Card>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => (
              <Card key={market.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Category & Trending Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {market.category}
                  </span>
                  {market.trending && (
                    <span className="flex items-center gap-1 text-xs text-orange-600">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>

                {/* Question */}
                <h3 className="text-base font-semibold text-black mb-4 line-clamp-2">
                  {market.question}
                </h3>

                {/* Price Display */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-muted-text mb-1">YES</p>
                    <p className="text-xl font-bold text-green-600">
                      {(market.yesPrice * 100).toFixed(0)}¢
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-muted-text mb-1">NO</p>
                    <p className="text-xl font-bold text-red-600">
                      {(market.noPrice * 100).toFixed(0)}¢
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-text mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {market.totalVolume.toFixed(1)} SOL
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {market.participants}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(market.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
                    Buy YES
                  </Button>
                  <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50">
                    Buy NO
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 16, 17, 0.0)' }}>
        <Card className="max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-blue to-purple-600 mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-black mb-3">Coming Soon</h2>
          <p className="text-muted-text text-lg mb-6">
            Prediction Markets are currently under development
          </p>

          <div className="bg-soft-gray-bg rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-black mb-3">What to expect:</h3>
            <ul className="text-left space-y-2 text-sm text-muted-text">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Trade on future events with SOL & USDC</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Create custom markets for campus events</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Earn rewards for accurate predictions</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Real-time market updates and analytics</span>
              </li>
            </ul>
          </div>

          <Button variant="primary" onClick={() => window.location.href = '/'}>
            Return to Marketplace
          </Button>
        </Card>
      </div>
    </div>
  );
}
