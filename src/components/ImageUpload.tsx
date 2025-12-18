"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useWallet } from "@solana/wallet-adapter-react";

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    folder?: string;
    currentImage?: string;
    maxSizeMB?: number;
}

export default function ImageUpload({
    onUploadComplete,
    folder = "products",
    currentImage,
    maxSizeMB = 5,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wallet = useWallet();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check wallet connection
        if (!wallet.connected || !wallet.publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size
        const sizeMB = file.size / 1024 / 1024;
        if (sizeMB > maxSizeMB) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        setError(null);
        setSuccess(false);

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);
            formData.append("address", wallet.publicKey.toString());

            const res = await fetch("/api/storage", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await res.json();
            setSuccess(true);
            onUploadComplete(data.url);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setPreview(currentImage || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        setSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-3">
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg transition-colors ${preview
                    ? "border-border-gray"
                    : "border-border-gray hover:border-primary-blue"
                    }`}
            >
                {preview ? (
                    <div className="relative aspect-video">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                        />
                        {!uploading && (
                            <button
                                onClick={handleRemove}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center aspect-video cursor-pointer p-6">
                        <Upload className="w-12 h-12 text-muted-text mb-3" />
                        <p className="text-sm font-medium text-black mb-1">
                            Click to upload image
                        </p>
                        <p className="text-xs text-muted-text">
                            PNG, JPG, WEBP up to {maxSizeMB}MB
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            {/* Status Messages */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Image uploaded successfully!</span>
                </div>
            )}

            {/* Upload Button (alternative to drag & drop) */}
            {!preview && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
