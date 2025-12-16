"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@solana/react-hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const wallet = useWallet();
    const toast = useToast();
    const productId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        currency: "SOL",
        category: "",
        image_url: "",
        inventory: "",
        original_price: ""
    });

    const address = wallet.status === "connected" ? wallet.session.account.address.toString() : null;

    useEffect(() => {
        if (productId && address) {
            fetchProduct();
        }
    }, [productId, address]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();

            if (!data.product) {
                toast.error("Product not found");
                router.push("/dashboard/products");
                return;
            }

            // Check ownership via store
            if (data.product.stores?.owner_address !== address) {
                toast.error("You don't have permission to edit this product");
                router.push("/dashboard/products");
                return;
            }

            setProduct(data.product);
            setFormData({
                name: data.product.name || "",
                description: data.product.description || "",
                price: data.product.price?.toString() || "",
                currency: data.product.currency || "SOL",
                category: data.product.category || "",
                image_url: data.product.image_url || "",
                inventory: data.product.inventory?.toString() || "",
                original_price: data.product.original_price?.toString() || ""
            });
        } catch (error) {
            console.error("Failed to fetch product:", error);
            toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!address) {
            toast.error("Please connect your wallet");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/products/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    userAddress: address,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    currency: formData.currency,
                    category: formData.category,
                    image_url: formData.image_url || null,
                    inventory: formData.inventory ? parseInt(formData.inventory) : null,
                    original_price: formData.original_price ? parseFloat(formData.original_price) : null
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Product updated successfully!");
                router.push("/dashboard/products");
            } else {
                toast.error(data.error || "Failed to update product");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    if (wallet.status !== "connected") {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-muted-text">Please connect your wallet to edit your product</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8">
                <div className="max-w-2xl mx-auto">
                    <p className="text-center text-muted-text">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg px-4 py-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => router.push("/dashboard/products")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">Edit Product</h1>
                        <p className="text-sm md:text-base text-muted-text">Update product details</p>
                    </div>
                </div>

                {/* Edit Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="Product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency *
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                >
                                    <option value="SOL">SOL</option>
                                    <option value="USDC">USDC</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                >
                                    <option value="">Select category</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Books">Books</option>
                                    <option value="Food">Food</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stock/Inventory
                                </label>
                                <input
                                    type="number"
                                    name="inventory"
                                    value={formData.inventory}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="Available quantity"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                                    placeholder="Describe your product..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Original Price (for discount display)
                                </label>
                                <input
                                    type="number"
                                    name="original_price"
                                    value={formData.original_price}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-muted-text mt-1">
                                    If set higher than price, a discount badge will be shown
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Image URL
                                </label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.image_url && (
                                    <div className="mt-3">
                                        <img
                                            src={formData.image_url}
                                            alt="Product preview"
                                            className="w-full max-w-xs h-48 object-cover rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                                className="flex-1"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/dashboard/products")}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
