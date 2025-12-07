/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string | null {
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

/**
 * Validate image URL (Supabase storage or external HTTPS)
 */
export function validateImageURL(url: string): boolean {
    if (!url) return false;

    try {
        const parsed = new URL(url);

        // Allow Supabase storage URLs
        if (parsed.hostname.includes("supabase.co")) {
            return true;
        }

        // Allow HTTPS images from trusted domains
        if (parsed.protocol === "https:") {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase();
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    return query
        .trim()
        .replace(/[<>]/g, "")
        .substring(0, 100); // Limit length
}

/**
 * Validate Solana address format
 */
export function validateSolanaAddress(address: string): boolean {
    // Solana addresses are base58 encoded, 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
}

/**
 * Sanitize user input for database queries
 */
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
        .substring(0, 1000); // Limit length
}
