"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ImageUpload";
import { useToast } from "@/hooks/useToast";

type ProductFormProps = {
  storeId?: string;
  onSuccess?: () => void;
};

const CATEGORIES = [
  "Electronics",
  "Books & Textbooks",
  "Clothing & Fashion",
  "Food & Beverages",
  "Sports & Fitness",
  "Home & Living",
  "Beauty & Personal Care",
  "Stationery & Supplies",
  "Services",
  "Other",
];

export default function ProductForm({ storeId, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      storeId: storeId || String(formData.get("storeId")),
      name: String(formData.get("name")),
      description: String(formData.get("description")) || undefined,
      category: category || "Other",
      price: Number(formData.get("price")),
      inventory: Number(formData.get("inventory")),
      imageUrl: imageUrl || undefined,
    };

    try {
      const res = await fetch("/api/product/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Product created!", "Your product is now live");
        onSuccess?.();
        e.currentTarget.reset();
        setImageUrl("");
        setCategory("");
      } else {
        const error = await res.json();
        toast.error("Failed to create product", error.error || "Please try again");
      }
    } catch (error) {
      toast.error("Error", "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-black mb-6">Add New Product</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Image */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Product Image
          </label>
          <ImageUpload
            onUploadComplete={setImageUrl}
            folder="products"
            currentImage={imageUrl}
          />
        </div>

        {/* Product Name */}
        <Input
          name="name"
          label="Product Name"
          placeholder="Enter product name"
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Describe your product..."
            rows={4}
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          />
        </div>

        {/* Price */}
        <Input
          name="price"
          label="Price (SOL)"
          type="number"
          step="0.01"
          placeholder="0.00"
          required
        />

        {/* Inventory */}
        <Input
          name="inventory"
          label="Inventory"
          type="number"
          placeholder="Available quantity"
          required
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Product"}
        </Button>
      </form>
    </Card>
  );
}
