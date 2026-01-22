/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ImageUpload";
import { useToast } from "@/hooks/useToast";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";

type ProductFormProps = {
  storeId?: string;
  productId?: string; // Added for edit mode
  initial?: any;
  onSuccess?: () => void;
};

export default function ProductForm({ storeId, productId, initial, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images || (initial?.imageUrl ? [initial.imageUrl] : []));
  const [category, setCategory] = useState(initial?.category || "");
  const [currency, setCurrency] = useState(initial?.currency || "SOL");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const toast = useToast();
  const { walletAddress, isAuthenticated } = useCivicWallet();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!walletAddress) {
      toast.error("Error", "Please wait for your wallet to be ready");
      return;
    }

    const formData = new FormData(form);
    const newErrors: { [key: string]: string } = {};

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryValue = String(formData.get("category") || "").trim();
    const priceValue = String(formData.get("price") || "").trim();
    const currencyValue = String(formData.get("currency") || "").trim();
    const inventoryValue = String(formData.get("inventory") || "").trim();

    if (!name) newErrors.name = "Product name is required";
    if (!description) newErrors.description = "Description is required";
    if (!categoryValue) newErrors.category = "Category is required";
    if (!priceValue || Number(priceValue) <= 0) newErrors.price = "Enter a valid price";
    if (!currencyValue) newErrors.currency = "Currency is required";
    if (!inventoryValue || Number(inventoryValue) <= 0) newErrors.inventory = "Enter available quantity";
    if (images.length === 0) newErrors.images = "At least one image is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Missing information", "Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setLoading(true);

    const basePayload = {
      name,
      description,
      category: categoryValue,
      price: Number(priceValue),
      currency: currencyValue,
      inventory: Number(inventoryValue),
      imageUrl: images[0], // Main image
      images: images,      // All images
      isPodEnabled: formData.get("isPodEnabled") === "true",
      original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
      originalPrice: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    };

    try {
      let res;
      if (productId) {
        // Edit Mode
        res = await fetch("/api/products/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            productId,
            userAddress: walletAddress,
            // Map keys if needed by update API (it expects image_url, etc)
            image_url: images[0],
          }),
        });
      } else {
        // Create Mode
        res = await fetch("/api/product/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            address: walletAddress,
            storeId: storeId || String(formData.get("storeId")),
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (productId && !data.success && !data.ok) {
          throw new Error(data.error || "Update failed");
        }

        toast.success(productId ? "Product updated!" : "Product created!",
          productId ? "Your changes have been saved" : "Your product is now live");
        onSuccess?.();
        if (!productId) {
          form.reset();
          setImages([]);
          setCategory("");
          setCurrency("SOL");
        }
      } else {
        const error = await res.json();
        toast.error("Failed to save product", error.error || "Please try again");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-black mb-6">{productId ? "Edit Product" : "Add New Product"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Product Images (Max 10)
          </label>
          <ImageUpload
            value={images}
            onChange={(val) => setImages(Array.isArray(val) ? val : [val])}
            folder="products"
            allowMultiple={true}
            maxFiles={10}
          />
          <p className="text-xs text-muted-text mt-2">
            Add at least one image. The first image will be the main product photo.
          </p>
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
        </div>

        <Input
          name="name"
          label="Product Name"
          placeholder="Enter product name"
          defaultValue={initial?.name}
          error={errors.name}
          required
        />

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="isPodEnabled"
            name="isPodEnabled"
            value="true"
            defaultChecked={initial?.is_pod_enabled || initial?.isPodEnabled}
            className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
          />
          <label htmlFor="isPodEnabled" className="text-sm font-medium text-black">
            Accept Pay on Delivery
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            name="category"
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
            placeholder="Describe your product..."
            defaultValue={initial?.description}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              name="price"
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={initial?.price}
              error={errors.price}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.currency
                ? "border-red-500 focus:ring-red-500"
                : "border-border-gray focus:ring-primary-blue"
              }`}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.currency && (
          <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
        )}

        {/* Original Price (Optional) */}
        <div>
          <Input
            name="original_price"
            label="Original Price (Optional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={initial?.original_price}
          />
          <p className="text-xs text-muted-text mt-1">If set higher than price, a discount badge will be shown</p>
        </div>

        <Input
          name="inventory"
          label="Inventory"
          type="number"
          placeholder="Available quantity"
          defaultValue={initial?.inventory}
          error={errors.inventory}
          required
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? (productId ? "Updating..." : "Creating...") : (productId ? "Update Product" : "Create Product")}
        </Button>
      </form>
    </Card>
  );
}
