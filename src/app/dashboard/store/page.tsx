"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import StoreForm from "@/components/StoreForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Store, Plus, MapPin, Edit, Loader2 } from "lucide-react";
import ShareStoreButton from "@/components/ShareStoreButton";
import { motion } from "framer-motion";

export default function DashboardStorePage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use Civic wallet hook for unified auth
  const { walletAddress, isAuthenticated, isLoading: authLoading } = useCivicWallet();

  useEffect(() => {
    fetchStores();
  }, [walletAddress, isAuthenticated]);

  async function fetchStores() {
    if (authLoading) return;

    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/store/list?address=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleStoreCreated() {
    setShowForm(false);
    fetchStores(); // Refresh the list
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/80 rounded-2xl border border-white/70">
              <Store className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-black truncate">My Stores</h1>
              <p className="text-sm text-muted-text">
                {stores.length > 0
                  ? `Managing ${stores.length} store${stores.length > 1 ? "s" : ""}`
                  : "Create your first store to start selling"}
              </p>
            </div>
          </div>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Store
            </Button>
          )}
        </motion.div>

        {/* Store Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-panel rounded-3xl p-5 sm:p-6"
          >
            <StoreForm onSuccess={handleStoreCreated} />
          </motion.div>
        )}

        {/* Store List */}
        {!showForm && stores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid gap-4"
          >
            {stores.map((store) => (
              <Card key={store.id} className="p-5 sm:p-6 border-white/60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-black">{store.name}</h3>
                      <span className="px-2 py-1 bg-white/80 text-primary-blue text-xs font-medium rounded-full border border-white/70">
                        {store.category}
                      </span>
                    </div>
                    <p className="text-muted-text mb-3">{store.description}</p>
                    {store.banner_url && (
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-48 object-cover rounded-2xl mb-3 border border-white/70"
                      />
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-text">
                      <MapPin className="w-4 h-4" />
                      <span>Location: {store.lat}, {store.lon}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShareStoreButton
                      storeId={store.id}
                      storeName={store.name}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/store/edit/${store.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!showForm && stores.length === 0 && (
          <Card className="border-white/60">
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No stores created yet</h3>
              <p className="text-muted-text mb-6">Create your first store to start selling</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your Store
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
