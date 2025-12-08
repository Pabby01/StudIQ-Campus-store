"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/react-hooks";
import { useToast } from "@/hooks/useToast";
import ImageUpload from "@/components/ImageUpload";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
    const params = useParams();
    const router = useRouter();
    const wallet = useWallet();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [category, setCategory] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (wallet.status !== "connected") {
            toast.error("Error", "Please connect your wallet");
            return;
        }

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const payload = {
            address: wallet.session.account.address.toString(),
            storeId: params.id,
            name: formData.get("name"),
            category: category || "Other",
            price: parseFloat(formData.get("price") as string),
            inventory: parseInt(formData.get("inventory") as string),
            description: formData.get("description"),
            imageUrl: imageUrl || undefined,
        };

        try {
            const res = await fetch("/api/product/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Product added!", "Your product is now live");
                router.push(`/dashboard/store/${params.id}/products`);
            } else {
                const error = await res.json();
                toast.error("Failed to add product", error.error || "Please try again");
            }
        } catch (error) {
            toast.error("Error", "Failed to add product");
        } finally {
            setLoading(false);
        }
    }

    const categories = [
        "Electronics",
        "Books & Textbooks",
        "Clothing",
        "Food & Beverages",
        "Stationery",
        "Sports & Fitness",
        "Home & Living",
        "Other",
    ];

    return (
        <div className="min-h-screen bg-soft-gray-bg p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link
                    href={`/dashboard/store/${params.id}/products`}
                    className="inline-flex items-center gap-2 text-muted-text hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </Link>

                <div>
                    <h1 className="text-3xl font-bold text-black mb-2">Add New Product</h1>
                    <p className="text-muted-text">
                        Fill in the details below to add a product to your store
                    </p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Product Image
                            </label>
                            <ImageUpload
                                folder="products"
                                onUploadComplete={(url: string) => setImageUrl(url)}
                                currentImage={imageUrl}
                            />
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="w-full px-4 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="e.g., MacBook Pro 2023"
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-black mb-2">
                                Category *
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-black mb-2">
                                    Price ($) *
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label htmlFor="inventory" className="block text-sm font-medium text-black mb-2">
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    id="inventory"
                                    name="inventory"
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="w-full px-4 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="Describe your product..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? "Adding..." : "Add Product"}
                            </Button>
                            <Link href={`/dashboard/store/${params.id}/products`} className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary-blue" />
                        Tips for Great Product Listings
                    </h3>
                    <ul className="text-sm text-muted-text space-y-1 list-disc list-inside">
                        <li>Use clear, high-quality images</li>
                        <li>Write detailed, accurate descriptions</li>
                        <li>Set competitive prices</li>
                        <li>Keep inventory updated</li>
                        <li>Choose the right category for better discoverability</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
