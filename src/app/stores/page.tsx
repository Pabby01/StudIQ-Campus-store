"use client";

import { useEffect, useState } from "react";
import StoreCard from "@/components/StoreCard";
import { Loader2, Store as StoreIcon } from "lucide-react";
import Button from "@/components/ui/Button";

type StoreType = Readonly<{
  id: string;
  name: string;
  category: string;
  banner_url?: string | null;
  description?: string | null;
  profiles?: {
    name: string;
  };
}>;

export default function StoresDirectoryPage() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch("/api/store/all?limit=50");
        const data = await res.json();
        if (data.ok) {
          setStores(data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div className="min-h-screen bg-soft-gray-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-3">Campus Store Directory</h1>
          <p className="text-lg text-muted-text">
            Explore student-run businesses, find services, and shop local on your campus.
          </p>
        </div>

        {/* Filters (Placeholder for now) */}
        {/* <div className="flex justify-center gap-2">
            {['All', 'Tech', 'Food', 'Services', 'Art'].map(cat => (
                <button key={cat} className="px-4 py-2 rounded-full bg-white border border-border-gray hover:border-primary-blue text-sm font-medium transition-colors">
                    {cat}
                </button>
            ))}
        </div> */}

        {/* Stores Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-black">No stores found</h3>
            <p className="text-muted-text">Be the first to open a store on campus!</p>
            <div className="mt-4">
              <Button variant="primary" onClick={() => window.location.href = '/dashboard/store'}>
                Create a Store
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} s={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
