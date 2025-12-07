"use client";

import { useState } from "react";
import UploadInput from "@/components/UploadInput";

type ProductInitial = Readonly<{ id: string; name: string; category: string; price: number; inventory: number; image_url?: string | null }>;

export default function ProductForm({ storeId, initial }: { storeId: string; initial?: ProductInitial }) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  async function onSubmit(form: FormData) {
    setSaving(true);
    const payload = Object.fromEntries(form.entries());
    const body = {
      ...(initial ? { id: initial.id } : {}),
      storeId,
      name: String(payload.name),
      category: String(payload.category),
      price: Number(payload.price),
      inventory: Number(payload.inventory),
      imageUrl: imageUrl || String(payload.imageUrl || ""),
    };
    const url = initial ? "/api/product/update" : "/api/product/create";
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) alert("Saved");
  }
  return (
    <form action={onSubmit} className="space-y-3">
      <input name="name" defaultValue={initial?.name ?? ""} className="w-full rounded-md border p-2" placeholder="Name" />
      <input name="category" defaultValue={initial?.category ?? ""} className="w-full rounded-md border p-2" placeholder="Category" />
      <input name="price" defaultValue={initial?.price ?? ""} type="number" step="0.01" className="w-full rounded-md border p-2" placeholder="Price" />
      <input name="inventory" defaultValue={initial?.inventory ?? ""} type="number" className="w-full rounded-md border p-2" placeholder="Inventory" />
      <input name="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-md border p-2" placeholder="Image URL" />
      <div>
        <div className="text-xs text-zinc-600">Upload image</div>
        <UploadInput bucket="product-images" onUploaded={setImageUrl} />
      </div>
      <button disabled={saving} className="rounded-md bg-black px-3 py-2 text-white">{saving ? "Saving..." : "Save"}</button>
    </form>
  );
}
