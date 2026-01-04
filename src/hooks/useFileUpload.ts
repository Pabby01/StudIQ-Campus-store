import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

interface UploadResult {
    url: string;
    path: string;
    fullPath: string;
}

interface UseFileUploadReturn {
    upload: (file: File, bucket?: string, folder?: string) => Promise<UploadResult>;
    uploading: boolean;
    progress: UploadProgress | null;
    error: string | null;
    reset: () => void;
}

/**
 * Custom hook for uploading files to Supabase Storage
 * 
 * @param {string} defaultBucket - Default storage bucket name (default: 'products')
 * @returns Uploader interface with upload function and state
 * 
 * @example
 * const { upload, uploading, progress, error } = useFileUpload();
 * 
 * const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     try {
 *       const result = await upload(file, 'products', 'listings');
 *       console.log('Uploaded:', result.url);
 *     } catch (err) {
 *       console.error('Upload failed:', err);
 *     }
 *   }
 * };
 */
export function useFileUpload(defaultBucket: string = 'products'): UseFileUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = getSupabaseClient();

    const upload = useCallback(
        async (file: File, bucket: string = defaultBucket, folder: string = ''): Promise<UploadResult> => {
            setUploading(true);
            setError(null);
            setProgress({ loaded: 0, total: file.size, percentage: 0 });

            try {
                // Validate file
                if (!file) {
                    throw new Error('No file provided');
                }

                // Validate file size (max 5MB for product images)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    throw new Error('File size must be less than 5MB');
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    throw new Error('File must be an image (JPEG, PNG, WebP, or GIF)');
                }

                // Generate unique filename
                const fileExt = file.name.split('.').pop();
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const fileName = `${timestamp}_${randomString}.${fileExt}`;
                const filePath = folder ? `${folder}/${fileName}` : fileName;

                // Upload file to Supabase Storage
                const { data, error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // Update progress to 100%
                setProgress({ loaded: file.size, total: file.size, percentage: 100 });

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(data.path);

                return {
                    url: publicUrl,
                    path: data.path,
                    fullPath: `${bucket}/${data.path}`,
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setUploading(false);
            }
        },
        [defaultBucket, supabase]
    );

    const reset = useCallback(() => {
        setUploading(false);
        setProgress(null);
        setError(null);
    }, []);

    return {
        upload,
        uploading,
        progress,
        error,
        reset,
    };
}
