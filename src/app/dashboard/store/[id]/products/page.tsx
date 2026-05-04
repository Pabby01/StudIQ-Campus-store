/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

type Store = {
    id: string;
    name: string;
    owner_address?: string | null;
};

type StoreProduct = {
    id: string;
    name: string;
    category?: string | null;
    price: number;
    inventory?: number | null;
    rating?: number | null;
    image_url?: string | null;
};

export default function StoreProductsPage() {
    const params = useParams();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchStoreAndProducts();
        }
    }, [params.id]);

    async function fetchStoreAndProducts() {
        try {
            const res = await fetch(`/api/store/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setStore(data.store);
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to fetch store:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
                <div className="text-center glass-panel rounded-3xl p-8 border border-white/60">
                    <h2 className="text-2xl font-bold text-black mb-2">Store not found</h2>
                    <Link href="/dashboard/store">
                        <Button variant="primary">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
                            {store.name} - Products
                        </h1>
                        <p className="text-sm text-muted-text">
                            Manage your store&apos;s product inventory
                        </p>
                    </div>
                    <Link href={`/dashboard/store/${params.id}/products/new`}>
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </motion.div>

                {/* Welcome Message for New Stores */}
                {products.length === 0 && (
                    <Card className="bg-white/80 border-white/70">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                                <span className="bg-white/80 p-1 rounded-xl border border-white/70">
                                    <Package className="w-5 h-5 text-primary-blue" />
                                </span>
                                Welcome! Let&apos;s add your first product
                            </h3>
                            <p className="text-muted-text mb-4">
                                Start selling by adding products to your store. You can add images, set prices, and manage inventory.
                            </p>
                            <Link href={`/dashboard/store/${params.id}/products/new`}>
                                <Button variant="primary">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Product
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Products List */}
                {products.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                        className="grid gap-4"
                    >
                        {products.map((product) => (
                            <Card key={product.id} className="p-5 sm:p-6 border-white/60">
                                <div className="flex items-start gap-4">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-24 h-24 object-cover rounded-2xl border border-white/70"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 bg-white/70 rounded-2xl flex items-center justify-center border border-white/70">
                                            <Package className="w-8 h-8 text-muted-text" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-black mb-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-muted-text mb-2">
                                            {product.category}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="font-semibold text-primary-blue">
                                                ${product.price}
                                            </span>
                                            <span className="text-muted-text">
                                                Stock: {product.inventory}
                                            </span>
                                            {product.rating && (
                                                <span className="text-muted-text">
                                                    {product.rating} stars
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </motion.div>
                )}

                {/* Quick Actions */}
                <Card className="p-6 border-white/60">
                    <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Link href={`/dashboard/store/${params.id}/products/new`}>
                            <button className="w-full p-4 text-left border border-white/70 bg-white/80 rounded-2xl hover:border-primary-blue hover:bg-white transition-all">
                                <Plus className="w-5 h-5 text-primary-blue mb-2" />
                                <div className="font-semibold text-black">Add Product</div>
                                <div className="text-sm text-muted-text">Create new product</div>
                            </button>
                        </Link>
                        <Link href={`/dashboard/store`}>
                            <button className="w-full p-4 text-left border border-white/70 bg-white/80 rounded-2xl hover:border-primary-blue hover:bg-white transition-all">
                                <Edit className="w-5 h-5 text-primary-blue mb-2" />
                                <div className="font-semibold text-black">Edit Store</div>
                                <div className="text-sm text-muted-text">Update store details</div>
                            </button>
                        </Link>
                        <Link href={`/store/${params.id}`}>
                            <button className="w-full p-4 text-left border border-white/70 bg-white/80 rounded-2xl hover:border-primary-blue hover:bg-white transition-all">
                                <Package className="w-5 h-5 text-primary-blue mb-2" />
                                <div className="font-semibold text-black">View Store</div>
                                <div className="text-sm text-muted-text">See public view</div>
                            </button>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
