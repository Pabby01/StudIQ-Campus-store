/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

type Store = {
  id: string;
  name: string;
  category: string;
  description: string;
  banner_url?: string;
  featured: boolean;
  featured_order: number;
  owner_address: string;
  profiles?: { name: string };
};

export default function FeaturedStoresPage() {
  const toast = useToast();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stores");
      if (res.ok) {
        const data = await res.json();
        const stores = data.stores || [];
        setAllStores(stores);

        // Separate featured stores and sort by featured_order
        const featured = stores
          .filter((s: Store) => s.featured)
          .sort((a: Store, b: Store) => a.featured_order - b.featured_order);
        setFeaturedStores(featured);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
      toast.error("Error", "Failed to load stores");
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    try {
      setSaving(true);
      const updates = featuredStores.map((store, index) => ({
        id: store.id,
        featured: true,
        featured_order: index,
      }));

      const res = await fetch("/api/admin/featured-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        toast.success("Saved", "Featured stores updated successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function addFeaturedStore(store: Store) {
    if (!featuredStores.find((s) => s.id === store.id)) {
      setFeaturedStores([...featuredStores, { ...store, featured_order: featuredStores.length }]);
    }
  }

  function removeFeaturedStore(storeId: string) {
    setFeaturedStores(featuredStores.filter((s) => s.id !== storeId));
  }

  function moveStore(index: number, direction: "up" | "down") {
    const newFeatured = [...featuredStores];
    if (direction === "up" && index > 0) {
      [newFeatured[index], newFeatured[index - 1]] = [newFeatured[index - 1], newFeatured[index]];
    } else if (direction === "down" && index < newFeatured.length - 1) {
      [newFeatured[index], newFeatured[index + 1]] = [newFeatured[index + 1], newFeatured[index]];
    }
    setFeaturedStores(newFeatured);
  }

  const availableStores = allStores.filter(
    (s) => !featuredStores.find((f) => f.id === s.id)
  );

  const filteredAvailable = availableStores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Featured Stores</h1>
          <p className="text-slate-600 mt-1">
            Manage which stores appear on the landing page
          </p>
        </div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Up to 3 stores will be featured on your landing page
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Drag to reorder or use the up/down buttons to change the display order
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Stores Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <div className="p-6 border-b border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-xl font-bold text-slate-900">Featured ({featuredStores.length}/3)</h2>
              </div>
              <p className="text-sm text-slate-600">
                Stores displayed on the landing page in this order
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {featuredStores.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No featured stores yet</p>
                  <p className="text-xs mt-1">Add stores from the list below</p>
                </div>
              ) : (
                <AnimatePresence>
                  {featuredStores.map((store, index) => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {store.banner_url && (
                          <img
                            src={store.banner_url}
                            alt={store.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              #{index + 1}
                            </span>
                            <h3 className="font-semibold text-slate-900 truncate">{store.name}</h3>
                          </div>
                          <p className="text-xs text-slate-600">{store.category}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveStore(index, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-50 transition-colors"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveStore(index, "down")}
                            disabled={index === featuredStores.length - 1}
                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-50 transition-colors"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFeaturedStore(store.id)}
                            className="p-1 hover:bg-red-100 text-red-600 hover:text-red-700 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Available Stores Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Available Stores</h2>
              <p className="text-sm text-slate-600 mt-1">
                Click to add stores to featured section
              </p>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Search stores by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>{searchQuery ? "No stores found" : "All stores are featured"}</p>
                  </div>
                ) : (
                  filteredAvailable.map((store) => (
                    <motion.button
                      key={store.id}
                      onClick={() => addFeaturedStore(store)}
                      whileHover={{ scale: 1.02 }}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {store.banner_url && (
                          <img
                            src={store.banner_url}
                            alt={store.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600">
                            {store.name}
                          </p>
                          <p className="text-xs text-slate-600">{store.category}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{store.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
