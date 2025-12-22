// Admin authentication helper
export function isAdmin(address: string | null): boolean {
    if (!address) return false;

    const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
        .split(",")
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

    return adminAddresses.includes(address);
}

export function requireAdmin(address: string | null) {
    if (!isAdmin(address)) {
        throw new Error("Unauthorized: Admin access required");
    }
}
