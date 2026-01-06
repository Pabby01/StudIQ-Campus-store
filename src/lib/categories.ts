// Unified category definitions for stores and products
// This ensures consistency across the entire application

export const CATEGORIES = [
    "Electronics",
    "Books & Textbooks",
    "Fashion & Clothing",
    "Food & Dining",
    "Groceries",
    "Sports & Fitness",
    "Health & Beauty",
    "Home & Living",
    "Stationery & Supplies",
    "Services",
    "Other",
] as const;

// Type for category values
export type Category = typeof CATEGORIES[number];

// Categories with "All" option for filtering
export const FILTER_CATEGORIES = ["All", ...CATEGORIES] as const;
export type FilterCategory = typeof FILTER_CATEGORIES[number];

// Helper to get a simplified version for URL/search
export function getCategorySlug(category: string): string {
    return category.toLowerCase().replace(/[&\s]+/g, "-");
}

// Helper to match partial category names (for filtering)
export function matchesCategory(productCategory: string, filterCategory: string): boolean {
    if (filterCategory === "All") return true;

    // Exact match
    if (productCategory === filterCategory) return true;

    // Partial match (e.g., "Electronics" matches "Electronics")
    const normalizedProduct = productCategory.toLowerCase();
    const normalizedFilter = filterCategory.toLowerCase();

    return normalizedProduct.includes(normalizedFilter) ||
        normalizedFilter.includes(normalizedProduct);
}
