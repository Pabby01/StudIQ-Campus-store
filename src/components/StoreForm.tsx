"use client";

import { useState } from "react";
import UploadInput from "@/components/UploadInput";

export default function StoreForm() {
  const [saving, setSaving] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  async function onSubmit(form: FormData) {
    setSaving(true);
    const payload = Object.fromEntries(form.entries());
    const body = {
      name: String(payload.name),
      category: String(payload.category),
      description: String(payload.description),
      lat: Number(payload.lat),
      lon: Number(payload.lon),
      bannerUrl: bannerUrl || String(payload.bannerUrl || ""),
    };
    const res = await fetch("/api/store/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) alert("Store created");
  }
  return (
    <form action={onSubmit} className="space-y-3">
      <input name="name" className="w-full rounded-md border p-2" placeholder="Store name" />
      <input name="category" className="w-full rounded-md border p-2" placeholder="Category" />
      <textarea name="description" className="w-full rounded-md border p-2" placeholder="Description" />
      <div className="flex gap-2">
        <input name="lat" type="number" className="w-full rounded-md border p-2" placeholder="Latitude" />
        <input name="lon" type="number" className="w-full rounded-md border p-2" placeholder="Longitude" />
      </div>
      <input name="bannerUrl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="w-full rounded-md border p-2" placeholder="Banner URL" />
      <div>
        <div className="text-xs text-zinc-600">Upload banner</div>
        <UploadInput bucket="store-banners" onUploaded={setBannerUrl} />
      </div>
      <button disabled={saving} className="rounded-md bg-black px-3 py-2 text-white">{saving ? "Saving..." : "Create Store"}</button>
    </form>
  );
}
