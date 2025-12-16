"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@solana/react-hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const wallet = useWallet();
    const toast = useToast();
    const storeId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        banner_url: ""
    });

    const address = wallet.status === "connected" ? wallet.session.account.address.toString() : null;

    useEffect(() => {
        if (storeId && address) {
            fetchStore();
        }
    }, [storeId, address]);

    const fetchStore = async () => {
        try {
            const res = await fetch(`/api/store/${storeId}`);
            const data = await res.json();

            if (!data.store) {
                toast.error("Store not found");
                router.push("/dashboard/store");
                return;
            }

            // Check ownership
            if (data.store.owner_address !== address) {
                toast.error("You don't have permission to edit this store");
                router.push("/dashboard/store");
                return;
            }

            setStore(data.store);
            setFormData({
                name: data.store.name || "",
                description: data.store.description || "",
                category: data.store.category || "",
                banner_url: data.store.banner_url || ""
            });
        } catch (error) {
            console.error("Failed to fetch store:", error);
            toast.error("Failed to load store");
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
            const res = await fetch("/api/store/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: storeId,
                    address,
                    ...formData,
                    // Keep existing lat/lon
                    lat: store.lat,
                    lon: store.lon,
                    bannerUrl: formData.banner_url
                })
            });

            const data = await res.json();

            if (data.ok) {
                toast.success("Store updated successfully!");
                router.push("/dashboard/store");
            } else {
                toast.error(data.error || "Failed to update store");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update store");
        } finally {
            setSaving(false);
        }
    };

    if (wallet.status !== "connected") {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-muted-text">Please connect your wallet to edit your store</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8">
                <div className="max-w-2xl mx-auto">
                    <p className="text-center text-muted-text">Loading store...</p>
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
                        onClick={() => router.push("/dashboard/store")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">Edit Store</h1>
                        <p className="text-sm md:text-base text-muted-text">Update your store information</p>
                    </div>
                </div>

                {/* Edit Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Store Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="My Awesome Store"
                            />
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
                                <option value="">Select a category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Books">Books</option>
                                <option value="Food">Food</option>
                                <option value="Services">Services</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
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
                                placeholder="Describe your store and what you sell..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Banner Image URL (optional)
                            </label>
                            <input
                                type="url"
                                name="banner_url"
                                value={formData.banner_url}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="https://example.com/banner.jpg"
                            />
                            {formData.banner_url && (
                                <div className="mt-3">
                                    <img
                                        src={formData.banner_url}
                                        alt="Banner preview"
                                        className="w-full h-32 object-cover rounded-lg"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
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
                                onClick={() => router.push("/dashboard/store")}
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
