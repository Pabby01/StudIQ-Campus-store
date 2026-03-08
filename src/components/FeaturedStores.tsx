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
            <Card className="group glass-card border-white/60 hover-lift cursor-pointer overflow-hidden">
                {store.banner_url ? (
                    <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        <Store className="w-12 h-12 text-primary-blue opacity-20" />
                    </div>
                )}
                <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-black group-hover:text-primary-blue transition-colors truncate">
                            {store.name}
                        </h3>
                        <span className="px-2 py-0.5 glass-pill text-primary-blue text-[10px] font-medium rounded-full shrink-0">
                            {store.category}
                        </span>
                    </div>
                    <p className="text-xs text-muted-text line-clamp-2 mb-2">
                        {store.description}
                    </p>
                    {store.profiles?.name && (
                        <p className="text-[10px] text-muted-text flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" />
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
            const res = await fetch("/api/store/all?limit=3&featured=true");
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
            <section className="glass-panel rounded-3xl p-8 text-center">
                <div className="animate-pulse text-muted-text">Loading stores...</div>
            </section>
        );
    }

    if (stores.length === 0) {
        return null;
    }

    return (
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-black mb-1">Featured Stores</h2>
                    <p className="text-sm text-muted-text">Discover amazing stores from your campus community</p>
                </div>
                <Link
                    href="/stores"
                    className="flex items-center gap-2 text-xs text-primary-blue font-medium px-3 py-1.5 rounded-full glass-pill hover:bg-white/90 transition-colors"
                >
                    View All <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                ))}
            </div>
        </section>
    );
}
