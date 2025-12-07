"use client";

import { useState } from "react";

export default function UploadInput({ bucket, onUploaded }: { bucket: "product-images" | "store-banners" | "profile-photos"; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const path = `${Date.now()}-${file.name}`;
        const res = await fetch("/api/storage/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucket, path }) });
        const data = await res.json();
        if (!data?.token) { setUploading(false); return; }
        const uploadRes = await fetch(data.signedUrl, { method: "PUT", headers: { "x-upsert": "true", "Content-Type": file.type, "x-supabase-token": data.token }, body: file });
        setUploading(false);
        if (uploadRes.ok) {
          const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
          onUploaded(publicUrl);
        }
      }}
      disabled={uploading}
    />
  );
}

