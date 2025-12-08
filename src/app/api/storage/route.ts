import { getSupabaseServerClient } from "@/lib/supabase";
import { sanitizeFilename } from "@/lib/sanitize";
import { APIError, handleAPIError } from "@/lib/errors";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folder = (formData.get("folder") as string) || "products";
        const address = formData.get("address") as string;

        if (!address) {
            throw new APIError(401, "UNAUTHORIZED", "Wallet address required");
        }

        if (!file) {
            throw new APIError(400, "NO_FILE", "No file provided");
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new APIError(
                400,
                "INVALID_TYPE",
                `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(", ")}`
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new APIError(
                400,
                "FILE_TOO_LARGE",
                `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
            );
        }

        const supabase = getSupabaseServerClient();

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const sanitized = sanitizeFilename(file.name.replace(`.${ext}`, ""));
        const filename = `${sanitized}-${Date.now()}.${ext}`;
        const path = `${folder}/${address}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("uploads")
            .upload(path, file, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error);
            throw new APIError(500, "UPLOAD_FAILED", `Failed to upload file: ${error.message}`);
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(data.path);

        return Response.json({
            ok: true,
            url: publicUrl,
            path: data.path,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        return handleAPIError(error);
    }
}

// Delete uploaded file
export async function DELETE(req: Request) {
    try {
        const { path, address } = await req.json();

        if (!address) {
            throw new APIError(401, "UNAUTHORIZED", "Wallet address required");
        }

        if (!path) {
            throw new APIError(400, "NO_PATH", "File path required");
        }

        // Verify user owns this file (path should contain their address)
        if (!path.includes(address)) {
            throw new APIError(403, "FORBIDDEN", "You don't own this file");
        }

        const supabase = getSupabaseServerClient();

        const { error } = await supabase.storage.from("uploads").remove([path]);

        if (error) {
            throw new APIError(500, "DELETE_FAILED", "Failed to delete file");
        }

        return Response.json({ ok: true });
    } catch (error) {
        return handleAPIError(error);
    }
}
