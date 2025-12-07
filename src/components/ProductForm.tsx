"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type ProductFormProps = {
  storeId?: string;
  onSuccess?: () => void;
};

export default function ProductForm({ storeId, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      storeId: storeId || String(formData.get("storeId")),
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      price: Number(formData.get("price")),
      inventory: Number(formData.get("inventory")),
      imageUrl: String(formData.get("imageUrl")) || undefined,
    };

    try {
      const res = await fetch("/api/product/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
        e.currentTarget.reset();
      } else {
        alert("Failed to create product");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-black mb-6">Add New Product</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" label="Product Name" placeholder="Enter product name" required />
        <Input name="category" label="Category" placeholder="e.g., Electronics, Books" required />
        <Input
          name="price"
          label="Price ($)"
          type="number"
          step="0.01"
          placeholder="0.00"
          required
        />
        <Input
          name="inventory"
          label="Inventory"
          type="number"
          placeholder="Available quantity"
          required
        />
        <Input name="imageUrl" label="Image URL (optional)" placeholder="https://..." />

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Product"}
        </Button>
      </form>
    </Card>
  );
}
