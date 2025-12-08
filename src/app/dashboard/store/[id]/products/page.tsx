"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/react-hooks";
import { Package, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function StoreProductsPage() {
    const params = useParams();
    const router = useRouter();
    const wallet = useWallet();
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
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
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-black mb-2">Store not found</h2>
                    <Link href="/dashboard/store">
                        <Button variant="primary">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black mb-2">
                            {store.name} - Products
                        </h1>
                        <p className="text-muted-text">
                            Manage your store's product inventory
                        </p>
                    </div>
                    <Link href={`/dashboard/store/${params.id}/products/new`}>
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Welcome Message for New Stores */}
                {products.length === 0 && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-black mb-2">
                                🎉 Welcome! Let's add your first product
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
                    <div className="grid gap-4">
                        {products.map((product) => (
                            <Card key={product.id} className="p-6">
                                <div className="flex items-start gap-4">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
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
                                                    ⭐ {product.rating}
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
                    </div>
                )}

                {/* Quick Actions */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Link href={`/dashboard/store/${params.id}/products/new`}>
                            <button className="w-full p-4 text-left border border-border-gray rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-all">
                                <Plus className="w-5 h-5 text-primary-blue mb-2" />
                                <div className="font-semibold text-black">Add Product</div>
                                <div className="text-sm text-muted-text">Create new product</div>
                            </button>
                        </Link>
                        <Link href={`/dashboard/store`}>
                            <button className="w-full p-4 text-left border border-border-gray rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-all">
                                <Edit className="w-5 h-5 text-primary-blue mb-2" />
                                <div className="font-semibold text-black">Edit Store</div>
                                <div className="text-sm text-muted-text">Update store details</div>
                            </button>
                        </Link>
                        <Link href={`/store/${params.id}`}>
                            <button className="w-full p-4 text-left border border-border-gray rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-all">
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
