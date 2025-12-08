"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Store, MapPin, ArrowRight } from "lucide-react";

interface StoreCardProps {
    store: {
        id: string;
        name: string;
        category: string;
        description: string;
        banner_url?: string;
        profiles?: { name: string };
    };
}

function StoreCard({ store }: StoreCardProps) {
    return (
        <Link href={`/store/${store.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                {store.banner_url ? (
                    <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        <Store className="w-16 h-16 text-primary-blue opacity-20" />
                    </div>
                )}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-black group-hover:text-primary-blue transition-colors">
                            {store.name}
                        </h3>
                        <span className="px-2 py-1 bg-blue-50 text-primary-blue text-xs font-medium rounded">
                            {store.category}
                        </span>
                    </div>
                    <p className="text-sm text-muted-text line-clamp-2 mb-3">
                        {store.description}
                    </p>
                    {store.profiles?.name && (
                        <p className="text-xs text-muted-text flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            by {store.profiles.name}
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
}

export default function FeaturedStores() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStores();
    }, []);

    async function fetchStores() {
        try {
            const res = await fetch("/api/store/all?limit=6&featured=true");
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

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <div className="animate-pulse">Loading stores...</div>
                    </div>
                </div>
            </section>
        );
    }

    if (stores.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-black mb-2">Featured Stores</h2>
                        <p className="text-muted-text">Discover amazing stores from your campus community</p>
                    </div>
                    <Link
                        href="/stores"
                        className="flex items-center gap-2 text-primary-blue hover:gap-3 transition-all font-medium"
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => (
                        <StoreCard key={store.id} store={store} />
                    ))}
                </div>
            </div>
        </section>
    );
}
