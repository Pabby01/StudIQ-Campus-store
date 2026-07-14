import { useState, useCallback } from 'react';

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
 * Custom hook for uploading files securely via pre-signed URLs
 * 
 * @param {string} defaultBucket - Default storage bucket name (default: 'products')
 * @returns Uploader interface with upload function and state
 */
export function useFileUpload(defaultBucket: string = 'products'): UseFileUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(
        async (file: File, bucket: string = defaultBucket, folder: string = ''): Promise<UploadResult> => {
            setUploading(true);
            setError(null);
            setProgress({ loaded: 0, total: file.size, percentage: 0 });

            try {
                // Validate file
                if (!file) throw new Error('No file provided');

                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) throw new Error('File size must be less than 5MB');

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

                // 1. Get signed upload URL from secure backend
                const urlRes = await fetch('/api/storage/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bucket, path: filePath })
                });

                if (!urlRes.ok) {
                    const data = await urlRes.json();
                    throw new Error(data.error || 'Failed to get upload URL');
                }

                const { signedUrl, token } = await urlRes.json();

                // 2. Upload file to signed URL
                const uploadRes = await fetch(signedUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': file.type,
                    },
                    body: file,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload file to storage');
                }

                setProgress({ loaded: file.size, total: file.size, percentage: 100 });

                // The public URL can be constructed if bucket is public, but we should parse it from the signed URL
                // signedUrl is like https://<project>.supabase.co/storage/v1/object/upload/sign/<bucket>/<path>?token=...
                const baseUrl = signedUrl.split('/object/upload/sign/')[0];
                const publicUrl = `${baseUrl}/object/public/${bucket}/${filePath}`;

                return {
                    url: publicUrl,
                    path: filePath,
                    fullPath: `${bucket}/${filePath}`,
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setUploading(false);
            }
        },
        [defaultBucket]
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
