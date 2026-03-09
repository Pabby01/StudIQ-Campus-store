/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Store as StoreIcon, MapPin, Star, Package, ShoppingBag, Share2, ArrowLeft, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

type Store = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  rating?: number | null;
  owner_address?: string;
  total_sales?: number;
};

// ... existing types ...

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // ... useEffect logic ...

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ... loading states ...

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg pb-20">
      {/* Header / Banner */}
      <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden">
        {store?.banner_url ? (
          <Image
            src={store.banner_url}
            alt={store.name}
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-slate-900 flex items-center justify-center">
            <StoreIcon className="w-24 h-24 text-white/10" />
          </div>
        )}
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-white/60">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            
            {/* Store Logo/Icon */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-white shadow-lg p-2 -mt-16 sm:-mt-20 flex-shrink-0">
              {store?.logo_url ? (
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                   <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary-blue to-blue-600 flex items-center justify-center text-white">
                  <span className="text-3xl font-bold">{store?.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{store?.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700 border border-slate-200">
                      {store?.category}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-slate-900">4.8</span>
                      <span className="text-slate-400">(120)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <Button 
                     variant="outline" 
                     className="rounded-full h-10 px-5 border-slate-200 hover:bg-slate-50"
                     onClick={handleShare}
                   >
                     {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                     {copied ? "Copied" : "Share"}
                   </Button>
                   <Button variant="primary" className="rounded-full h-10 px-6 shadow-lg shadow-primary-blue/20">
                     Follow Store
                   </Button>
                </div>
              </div>

              {store?.description && (
                <p className="text-slate-600 leading-relaxed max-w-3xl">{store.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 max-w-lg">
                <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Products</p>
                   <p className="text-xl font-bold text-slate-900 mt-1">{products.length}</p>
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales</p>
                   <p className="text-xl font-bold text-slate-900 mt-1">{store?.total_sales || '240+'}</p>
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</p>
                   <p className="text-xl font-bold text-slate-900 mt-1">Mar 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-blue" />
              Store Products
            </h2>
            
            {/* Optional: Filter/Sort could go here */}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No products yet</h3>
              <p className="text-slate-500">This store hasn&apos;t added any items to their catalog.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
