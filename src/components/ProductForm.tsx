"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ImageUpload";
import { useToast } from "@/hooks/useToast";
import { useWallet } from "@solana/react-hooks";
import { X } from "lucide-react";

type ProductFormProps = {
  storeId?: string;
  initial?: any; // Using any for flexibility, but ideally should be Product type
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

export default function ProductForm({ storeId, initial, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images || (initial?.imageUrl ? [initial.imageUrl] : []));
  const [category, setCategory] = useState(initial?.category || "");
  const router = useRouter();
  const toast = useToast();
  const wallet = useWallet();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (wallet.status !== "connected" || !wallet.session?.account?.address) {
      toast.error("Error", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Validate images
    if (images.length === 0) {
      toast.error("Error", "At least one image is required");
      setLoading(false);
      return;
    }

    const payload = {
      address: wallet.session.account.address.toString(),
      storeId: storeId || String(formData.get("storeId")),
      name: formData.get("name"),
      description: String(formData.get("description")) || undefined,
      category: formData.get("category"),
      price: Number(formData.get("price")),
      currency: formData.get("currency"),
      inventory: Number(formData.get("inventory")),
      imageUrl: images[0], // Main image for backward compatibility
      images: images,      // All images
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
        setImages([]);
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
      <h3 className="text-lg font-semibold text-black mb-6">{initial ? "Edit Product" : "Add New Product"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Image */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Product Images (Max 10)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-border-gray" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {images.length < 10 && (
              <div className="aspect-square">
                <ImageUpload
                  key={images.length}
                  onUploadComplete={(url) => setImages([...images, url])}
                  folder="products"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-text mt-2">
            Add at least one image. The first image will be the main product photo.
          </p>
        </div>

        {/* Product Name */}
        <Input
          name="name"
          label="Product Name"
          placeholder="Enter product name"
          defaultValue={initial?.name}
          required
        />

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="isPodEnabled"
            name="isPodEnabled"
            value="true"
            defaultChecked={initial?.is_pod_enabled}
            className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
          />
          <label htmlFor="isPodEnabled" className="text-sm font-medium text-black">
            Accept Pay on Delivery
          </label>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            name="category"
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
            defaultValue={initial?.description}
            rows={4}
            className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          />
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              name="price"
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={initial?.price}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Currency
            </label>
            <select
              name="currency"
              defaultValue={initial?.currency || "SOL"}
              className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        {/* Inventory */}
        <Input
          name="inventory"
          label="Inventory"
          type="number"
          placeholder="Available quantity"
          defaultValue={initial?.inventory}
          required
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? (initial ? "Updating..." : "Creating...") : (initial ? "Update Product" : "Create Product")}
        </Button>
      </form>
    </Card>
  );
}
