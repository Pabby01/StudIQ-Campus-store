"use client";

import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Store, ArrowRight } from "lucide-react";

interface StoreCardProps {
    store: {
        id: string;
        name: string;
        category: string;
        description?: string | null;
        banner_url?: string | null;
        profiles?: { name: string };
    };
}

function StoreCard({ store }: StoreCardProps) {
    return (
        <Link href={`/store/${store.id}`}>
            <Card className="group glass-card border-white/60 hover-lift cursor-pointer overflow-hidden transition-transform duration-300">
                {store.banner_url ? (
                    <div className="relative h-32 overflow-hidden">
                        <Image
                            src={store.banner_url}
                            alt={store.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
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

type FeaturedStoresProps = {
    stores: any[];
    loading?: boolean;
};

export default function FeaturedStores({ stores, loading = false }: FeaturedStoresProps) {
    if (loading) {
        return (
            <section className="glass-panel rounded-3xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="h-7 w-40 rounded-full bg-slate-200/70 animate-pulse mb-2" />
                        <div className="h-4 w-64 max-w-full rounded-full bg-slate-200/60 animate-pulse" />
                    </div>
                    <div className="h-8 w-20 rounded-full bg-slate-200/60 animate-pulse" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="rounded-2xl border border-white/60 bg-white/70 overflow-hidden animate-pulse">
                            <div className="h-32 bg-slate-200/80" />
                            <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="h-4 w-28 rounded-full bg-slate-200/80" />
                                    <div className="h-4 w-16 rounded-full bg-slate-200/80" />
                                </div>
                                <div className="h-3 w-full rounded-full bg-slate-200/70" />
                                <div className="h-3 w-4/5 rounded-full bg-slate-200/70" />
                                <div className="h-3 w-24 rounded-full bg-slate-200/70" />
                            </div>
                        </div>
                    ))}
                </div>
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
                {stores.map((store, index) => (
                    <div
                        key={store.id}
                        className="transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                    >
                        <StoreCard store={store} />
                    </div>
                ))}
            </div>
        </section>
    );
}
