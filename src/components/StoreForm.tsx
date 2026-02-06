/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ImageUpload";
import { useToast } from "@/hooks/useToast";
import { CATEGORIES } from "@/lib/categories";
import { AlertCircle } from "lucide-react";

type StoreFormProps = {
  onSuccess?: () => void;
};



export default function StoreForm({ onSuccess }: StoreFormProps) {
  const [loading, setLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const toast = useToast();

  // Use Civic wallet hook for unified auth
  const { walletAddress, isAuthenticated, isCreatingWallet } = useCivicWallet();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    if (!walletAddress) {
      toast.error("Wallet not ready", "Please wait for your wallet to be created");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const newErrors: { [key: string]: string } = {};

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryValue = category.trim();
    const deliveryEnabled = formData.get("deliveryEnabled") === "on";
    const pickupEnabled = formData.get("pickupEnabled") === "on";
    const deliveryFeeRaw = String(formData.get("deliveryFee") || "").trim();
    const deliveryFee = deliveryFeeRaw ? Number(deliveryFeeRaw) : undefined;
    const deliveryNotes = String(formData.get("deliveryNotes") || "").trim();

    if (!name) newErrors.name = "Store name is required";
    if (!description) newErrors.description = "Description is required";
    if (!categoryValue) newErrors.category = "Category is required";
    if (!deliveryEnabled && !pickupEnabled) newErrors.deliveryMethods = "Select at least one delivery method";
    if (deliveryFeeRaw && (Number.isNaN(deliveryFee) || (deliveryFee ?? 0) < 0)) {
      newErrors.deliveryFee = "Delivery fee must be a valid number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Missing information", "Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    const payload = {
      address: walletAddress,
      name,
      description: description || undefined,
      category: categoryValue || "Other",
      bannerUrl: bannerUrl || undefined,
      lat: 0, // Default coordinates - you can add geolocation later
      lon: 0,
      deliveryEnabled,
      pickupEnabled,
      deliveryFee,
      deliveryNotes: deliveryNotes || undefined,
    };

    try {
      const res = await fetch("/api/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        toast.success("Store created!", "Your store is now live");
        // Redirect to product management for the new store
        window.location.href = `/dashboard/store/${data.id}/products`;
      } else {
        toast.error("Failed to create store", data.error || "Please try again");
      }
    } catch (error) {
      toast.error("Error", "Failed to create store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-black mb-6">Create Your Store</h3>

      {/* Show wallet status */}
      {isCreatingWallet && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-700">Creating your wallet...</span>
        </div>
      )}

      {!walletAddress && !isCreatingWallet && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">Waiting for wallet to be ready...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Banner */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Store Banner
          </label>
          <ImageUpload
            onUploadComplete={setBannerUrl}
            folder="stores"
            currentImage={bannerUrl}
          />
        </div>

        {/* Store Name */}
        <Input
          name="name"
          label="Store Name"
          placeholder="Enter your store name"
          required
          error={errors.name}
        />

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className={`w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.category
              ? "border-red-500 focus:ring-red-500"
              : "border-border-gray focus:ring-primary-blue"
            }`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Tell customers about your store..."
            rows={4}
            className={`w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none overflow-y-auto max-h-32 ${errors.description
              ? "border-red-500 focus:ring-red-500"
              : "border-border-gray focus:ring-primary-blue"
            }`}
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Location */}
        <Input
          name="location"
          label="Location (optional)"
          placeholder="e.g., Building A, Room 101"
          error={errors.location}
        />
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Delivery Options
          </label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-black">
              <input type="checkbox" name="deliveryEnabled" defaultChecked className="h-4 w-4" />
              Offer shipping
            </label>
            <label className="flex items-center gap-2 text-sm text-black">
              <input type="checkbox" name="pickupEnabled" defaultChecked className="h-4 w-4" />
              Offer pickup
            </label>
          </div>
          {errors.deliveryMethods && (
            <p className="mt-1 text-sm text-red-600">{errors.deliveryMethods}</p>
          )}
        </div>
        <Input
          name="deliveryFee"
          label="Delivery Fee (optional)"
          placeholder="0.00"
          type="number"
          min="0"
          step="0.01"
          error={errors.deliveryFee}
        />
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Delivery Notes (optional)
          </label>
          <textarea
            name="deliveryNotes"
            placeholder="e.g., Deliver only on weekdays between 9am-6pm"
            rows={3}
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !walletAddress || isCreatingWallet}
        >
          {loading ? "Creating..." : !walletAddress ? "Waiting for wallet..." : "Create Store"}
        </Button>
      </form>
    </Card>
  );
}
