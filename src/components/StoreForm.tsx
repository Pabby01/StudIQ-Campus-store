"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ImageUpload";
import { useToast } from "@/hooks/useToast";

type StoreFormProps = {
  onSuccess?: () => void;
};

const STORE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Academic",
  "Electronics",
  "Fashion & Clothing",
  "Books & Media",
  "Sports & Recreation",
  "Health & Beauty",
  "Services",
  "Other",
];

export default function StoreForm({ onSuccess }: StoreFormProps) {
  const [loading, setLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      description: String(formData.get("description")) || undefined,
      category: category || "Other",
      bannerUrl: bannerUrl || undefined,
      location: String(formData.get("location")) || undefined,
    };

    try {
      const res = await fetch("/api/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Store created!", "Your store is now live");
        onSuccess?.();
        e.currentTarget.reset();
        setBannerUrl("");
        setCategory("");
      } else {
        const error = await res.json();
        toast.error("Failed to create store", error.error || "Please try again");
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
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Tell customers about your store..."
            rows={4}
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
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
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Store"}
        </Button>
      </form>
    </Card>
  );
}
