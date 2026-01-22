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
  const toast = useToast();

  // Use Civic wallet hook for unified auth
  const { walletAddress, isAuthenticated, isCreatingWallet } = useCivicWallet();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!walletAddress) {
      toast.error("Wallet not ready", "Please wait for your wallet to be created");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      address: walletAddress,
      name: String(formData.get("name")),
      description: String(formData.get("description")) || undefined,
      category: category || "Other",
      bannerUrl: bannerUrl || undefined,
      lat: 0, // Default coordinates - you can add geolocation later
      lon: 0,
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
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Tell customers about your store..."
            rows={4}
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none overflow-y-auto max-h-32"
            required
          />
        </div>

        {/* Location */}
        <Input
          name="location"
          label="Location (optional)"
          placeholder="e.g., Building A, Room 101"
        />

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
