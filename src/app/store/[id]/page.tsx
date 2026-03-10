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
  owner_name?: string;
  owner_image?: string;
  stats?: {
    products: number;
    sales: number;
    joined_at: string;
    location: string;
  };
};

// ... existing types ...

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStoreData() {
      if (!params.id) return;
      try {
        const res = await fetch(`/api/store/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch store");
        const data = await res.json();
        setStore(data.store);
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [params.id]);

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Store Not Found</h2>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Banner */}
      <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden">
        {store.banner_url ? (
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
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-white shadow-lg p-2 -mt-16 sm:-mt-20 flex-shrink-0 relative group">
              {store.logo_url ? (
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                   <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <span className="text-3xl font-bold">{store.name.charAt(0)}</span>
                </div>
              )}
              {/* Owner Avatar Badge */}
              {store.owner_image && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100">
                  <Image src={store.owner_image} alt="Owner" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{store.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Badge variant="blue" className="bg-blue-50 text-blue-700 border-blue-100">
                      {store.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-slate-900">{store.rating || "New"}</span>
                      {store.rating && <span className="text-slate-400">({store.total_sales || 0})</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                        {copied ? "Copied" : "Share"}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20">
                        <MapPin className="w-4 h-4" />
                        <span>{store.stats?.location || "Campus"}</span>
                    </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-6 max-w-2xl">
                {store.description || "Welcome to our campus store! Check out our latest products and deals."}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Products</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{store.stats?.products || 0}</p>
                </div>
                <div className="text-center sm:text-left border-l border-slate-100 pl-4 sm:pl-0 sm:border-l-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{store.stats?.sales || "0"}+</p>
                </div>
                <div className="text-center sm:text-left border-l border-slate-100 pl-4 sm:pl-0 sm:border-l-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatDate(store.stats?.joined_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Store Products</h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard p={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No products yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              This store hasnt added any items to their catalog.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
