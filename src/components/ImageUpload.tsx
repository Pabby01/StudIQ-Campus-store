"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { optimizeImageFile } from "@/lib/imageOptimization";

interface ImageUploadProps {
    // New unified props
    value?: string | string[];
    onChange?: (value: string | string[]) => void;

    // Legacy props (for backward compatibility)
    onUploadComplete?: (url: string) => void;
    currentImage?: string;

    folder?: string;
    maxSizeMB?: number;
    allowMultiple?: boolean;
    maxFiles?: number;
}

export default function ImageUpload({
    value,
    onChange,
    onUploadComplete,
    currentImage,
    folder = "products",
    maxSizeMB = 5,
    allowMultiple = false,
    maxFiles = 5
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use Civic wallet hook for unified auth
    const { walletAddress, isAuthenticated, isCreatingWallet } = useCivicWallet();

    // Derive current images from props (handle both new and legacy)
    const images: string[] = Array.isArray(value)
        ? value
        : value
            ? [value]
            : currentImage
                ? [currentImage]
                : [];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check wallet connection
        if (!walletAddress) {
            if (isCreatingWallet) {
                setError("Please wait, wallet is being created...");
            } else {
                setError("Please sign in first");
            }
            return;
        }

        const file = files[0]; // Currently handling one upload at a time for simplicity
        const optimizedFile = await optimizeImageFile(file, { maxDimension: 1600, quality: 0.82 });

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size
const sizeMB = optimizedFile.size / 1024 / 1024;
        if (sizeMB > maxSizeMB) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Check max files
        if (allowMultiple && images.length >= maxFiles) {
            setError(`Maximum ${maxFiles} images allowed`);
            return;
        }

        setError(null);
        setSuccess(false);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", optimizedFile);
            formData.append("folder", folder);
            formData.append("address", walletAddress);

            const res = await fetch("/api/storage", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await res.json();
            const newUrl = data.url;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            // Update state via callbacks
            if (allowMultiple) {
                const newImages = [...images, newUrl];
                onChange?.(newImages);
            } else {
                onChange?.(newUrl);
                onUploadComplete?.(newUrl);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemove = (indexToRemove: number) => {
        if (allowMultiple) {
            const newImages = images.filter((_, i) => i !== indexToRemove);
            onChange?.(newImages);
        } else {
            onChange?.("");
            onUploadComplete?.(""); // Legacy support
        }
    };

    return (
        <div className="space-y-4">
            {/* Image Grid */}
            {images.length > 0 && (
                <div className={`grid gap-4 ${allowMultiple ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                    {images.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-border-gray bg-gray-50">
                            <img
                                src={url}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors transform hover:scale-110"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {(!images.length || (allowMultiple && images.length < maxFiles)) && (
                <div
                    className={`relative border-2 border-dashed rounded-lg transition-colors p-6 ${error
                            ? "border-red-200 bg-red-50"
                            : "border-border-gray hover:border-border-gray/80 hover:bg-gray-50 bg-white"
                        }`}
                >
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full min-h-[150px]">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-10 h-10 text-primary-blue animate-spin" />
                                <p className="text-sm font-medium text-primary-blue">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-blue-50 text-primary-blue rounded-full mb-3">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-black mb-1">
                                    {allowMultiple ? "Add Photos" : "Choose Image"}
                                </p>
                                <p className="text-xs text-muted-text text-center max-w-[200px]">
                                    {allowMultiple ? `Upload up to ${maxFiles} images.` : ""} Auto-optimizes large images to keep pages fast. PNG, JPG, WEBP up to {maxSizeMB}MB
                                </p>
                            </>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploading || !walletAddress}
                        />
                    </label>

                    {/* Authentication Overlay */}
                    {!walletAddress && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 transition-opacity">
                            <p className="text-sm font-medium text-muted-text mb-3">Sign in to upload images</p>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg animate-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Upload successful!</span>
                </div>
            )}
        </div>
    );
}
