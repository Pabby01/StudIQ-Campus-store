export type OptimizedImageOptions = {
  maxDimension?: number;
  quality?: number;
};

const DEFAULT_OPTIONS: Required<OptimizedImageOptions> = {
  maxDimension: 1600,
  quality: 0.82,
};

export async function optimizeImageFile(file: File, options: OptimizedImageOptions = {}): Promise<File> {
  if (typeof window === "undefined") {
    return file;
  }

  const { maxDimension, quality } = { ...DEFAULT_OPTIONS, ...options };

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale === 1 && file.size < 800 * 1024) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((nextBlob) => resolve(nextBlob), "image/webp", quality);
    });

    if (!blob) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, "webp"), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function replaceExtension(fileName: string, nextExtension: string) {
  const lastDot = fileName.lastIndexOf(".");
  const baseName = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  return `${baseName}.${nextExtension}`;
}