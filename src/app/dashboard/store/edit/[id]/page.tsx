/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { CATEGORIES } from "@/lib/categories";
import ImageUpload from "@/components/ImageUpload";

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const { walletAddress, isAuthenticated } = useCivicWallet();
    const toast = useToast();
    const storeId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        banner_url: "",
        delivery_enabled: true,
        pickup_enabled: true,
        delivery_fee: "",
        delivery_notes: ""
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const address = walletAddress;

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
                banner_url: data.store.banner_url || "",
                delivery_enabled: data.store.delivery_enabled ?? true,
                pickup_enabled: data.store.pickup_enabled ?? true,
                delivery_fee: data.store.delivery_fee != null ? String(data.store.delivery_fee) : "",
                delivery_notes: data.store.delivery_notes || ""
            });
        } catch (error) {
            console.error("Failed to fetch store:", error);
            toast.error("Failed to load store");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [e.target.name]: target.type === "checkbox" ? target.checked : target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!address) {
            toast.error("Please sign in first");
            return;
        }

        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) newErrors.name = "Store name is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.category.trim()) newErrors.category = "Category is required";
        if (!formData.delivery_enabled && !formData.pickup_enabled) newErrors.deliveryMethods = "Select at least one delivery method";
        if (formData.delivery_fee && (Number.isNaN(Number(formData.delivery_fee)) || Number(formData.delivery_fee) < 0)) {
            newErrors.deliveryFee = "Delivery fee must be a valid number";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Missing information", "Please fix the highlighted fields");
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
                    bannerUrl: formData.banner_url,
                    deliveryEnabled: formData.delivery_enabled,
                    pickupEnabled: formData.pickup_enabled,
                    deliveryFee: formData.delivery_fee ? Number(formData.delivery_fee) : undefined,
                    deliveryNotes: formData.delivery_notes || undefined
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
                    <p className="text-muted-text">Please sign in to edit your store</p>
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${errors.name
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-primary-blue"
                                }`}
                                placeholder="My Awesome Store"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${errors.category
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-primary-blue"
                                }`}
                            >
                                <option value="">Select a category</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                            )}
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none overflow-y-auto max-h-40 ${errors.description
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-primary-blue"
                                }`}
                                placeholder="Describe your store and what you sell..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Banner Image (optional)
                            </label>
                            <ImageUpload
                                value={formData.banner_url}
                                onChange={(val) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        banner_url: Array.isArray(val) ? (val[0] || "") : (val || "")
                                    }))
                                }
                                folder="stores"
                                allowMultiple={false}
                                maxFiles={1}
                            />
                            <p className="mt-2 text-xs text-muted-text">
                                Upload a banner to showcase your store. Recommended size ~1200x300.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Options
                            </label>
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="delivery_enabled"
                                        checked={formData.delivery_enabled}
                                        onChange={handleChange}
                                        className="h-4 w-4"
                                    />
                                    Offer shipping
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="pickup_enabled"
                                        checked={formData.pickup_enabled}
                                        onChange={handleChange}
                                        className="h-4 w-4"
                                    />
                                    Offer pickup
                                </label>
                            </div>
                            {errors.deliveryMethods && (
                                <p className="mt-1 text-sm text-red-600">{errors.deliveryMethods}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Fee (optional)
                            </label>
                            <input
                                type="number"
                                name="delivery_fee"
                                value={formData.delivery_fee}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${errors.deliveryFee
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-primary-blue"
                                    }`}
                                placeholder="0.00"
                            />
                            <p className="mt-1 text-xs text-muted-text">
                                Set a flat delivery fee per order when shipping is enabled.
                            </p>
                            {errors.deliveryFee && (
                                <p className="mt-1 text-sm text-red-600">{errors.deliveryFee}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Notes (optional)
                            </label>
                            <textarea
                                name="delivery_notes"
                                value={formData.delivery_notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none overflow-y-auto max-h-32 border-gray-300 focus:ring-primary-blue"
                                placeholder="e.g., Deliver only on weekdays between 9am-6pm"
                            />
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
