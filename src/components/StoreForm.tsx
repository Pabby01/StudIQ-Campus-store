"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type StoreFormProps = {
  onSuccess?: () => void;
};

export default function StoreForm({ onSuccess }: StoreFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      description: String(formData.get("description")),
      lat: Number(formData.get("lat")) || 0,
      lon: Number(formData.get("lon")) || 0,
      bannerUrl: String(formData.get("bannerUrl")) || undefined,
    };

    try {
      const res = await fetch("/api/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
        e.currentTarget.reset();
      } else {
        alert("Failed to create store");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-black mb-6">Create Your Store</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" label="Store Name" placeholder="Enter store name" required />
        <Input name="category" label="Category" placeholder="e.g., Food, Electronics" required />
        <div>
          <label className="block text-sm font-medium text-black mb-2">Description</label>
          <textarea
            name="description"
            className="w-full px-4 py-2.5 bg-white border border-border-gray rounded-lg text-black placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-200 min-h-[100px]"
            placeholder="Describe your store..."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input name="lat" label="Latitude" type="number" step="any" placeholder="0.0" />
          <Input name="lon" label="Longitude" type="number" step="any" placeholder="0.0" />
        </div>
        <Input name="bannerUrl" label="Banner URL (optional)" placeholder="https://..." />

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Store"}
        </Button>
      </form>
    </Card>
  );
}
