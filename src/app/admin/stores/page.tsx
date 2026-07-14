"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Loader2,
  AlertCircle,
  Search,
  MapPin,
  User,
  Phone,
  Mail,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type Store = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  country: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  rating: number;
  featured: boolean;
  createdAt: string;
  image_url?: string;
};

type StoresData = {
  stores: Store[];
  total: number;
};

export default function StoresPage() {
  const [data, setData] = useState<StoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStores();
  }, [currentPage, searchQuery]);

  async function fetchStores() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
      });
      const res = await fetch(`/api/admin/stores?${params}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          Stores Management
        </h1>
        <p className="text-slate-600 mt-1">
          View and manage all stores and store owners
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search stores by name or owner..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Stores</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {data?.total || 0}
          </p>
        </Card>
      </motion.div>

      {/* Stores Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {data?.stores && data.stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.stores.map((store) => (
              <Card
                key={store.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedStore(store)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {store.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {store.description}
                    </p>
                  </div>
                  {store.featured && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                {/* Owner Info */}
                <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-900 font-medium">
                      {store.ownerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{store.ownerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{store.ownerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {store.city}, {store.country}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {store.totalProducts}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {store.totalOrders}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {store.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Rating</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    Total Revenue:{" "}
                    <span className="text-green-600">
                      ${store.totalRevenue.toLocaleString()}
                    </span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No stores found</p>
          </Card>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-2"
        >
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </motion.div>
      )}

      {/* Store Detail Modal */}
      {selectedStore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStore(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedStore.name}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold">
                  Description
                </p>
                <p className="text-slate-900 mt-1">{selectedStore.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Owner</p>
                  <p className="text-slate-900">{selectedStore.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Email</p>
                  <p className="text-slate-900">{selectedStore.ownerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Phone</p>
                  <p className="text-slate-900">{selectedStore.ownerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold">
                    Location
                  </p>
                  <p className="text-slate-900">
                    {selectedStore.city}, {selectedStore.country}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Products</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedStore.totalProducts}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Orders</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedStore.totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ${(selectedStore.totalRevenue / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Rating</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedStore.rating.toFixed(1)}⭐
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
