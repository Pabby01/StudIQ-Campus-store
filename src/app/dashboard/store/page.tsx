"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/react-hooks";
import StoreForm from "@/components/StoreForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Store, Plus, MapPin, Edit, Loader2 } from "lucide-react";

export default function DashboardStorePage() {
  const [showForm, setShowForm] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();

  useEffect(() => {
    fetchStores();
  }, [wallet.status]);

  async function fetchStores() {
    if (wallet.status !== "connected") {
      setLoading(false);
      return;
    }

    try {
      const address = wallet.session.account.address.toString();
      const res = await fetch(`/api/store/list?address=${address}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Store className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">My Stores</h1>
              <p className="text-muted-text">
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
        </div>

        {/* Store Form */}
        {showForm && <StoreForm onSuccess={handleStoreCreated} />}

        {/* Store List */}
        {!showForm && stores.length > 0 && (
          <div className="grid gap-4">
            {stores.map((store) => (
              <Card key={store.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-black">{store.name}</h3>
                      <span className="px-2 py-1 bg-blue-50 text-primary-blue text-xs font-medium rounded">
                        {store.category}
                      </span>
                    </div>
                    <p className="text-muted-text mb-3">{store.description}</p>
                    {store.banner_url && (
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-text">
                      <MapPin className="w-4 h-4" />
                      <span>Location: {store.lat}, {store.lon}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!showForm && stores.length === 0 && (
          <Card>
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
