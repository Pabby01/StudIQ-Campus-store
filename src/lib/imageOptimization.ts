import imageCompression from 'browser-image-compression';

export type OptimizedImageOptions = {
  maxDimension?: number;
  quality?: number;
};

export async function optimizeImageFile(file: File, options?: OptimizedImageOptions): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const compressionOptions = {
    maxSizeMB: 0.3, // Enforce 300KB limit
    maxWidthOrHeight: options?.maxDimension || 1080, // Enforce 1080px limit
    useWebWorker: true,
    fileType: 'image/webp'
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Compression failed:", error);
    return file;
  }
}