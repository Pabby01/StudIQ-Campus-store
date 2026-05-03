import { useState, useEffect } from 'react';

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  priceNgn: number;
  timestamp: number;
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recently viewed:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addProduct = (product: Omit<RecentlyViewedProduct, 'timestamp'>) => {
    setProducts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front with timestamp
      const updated = [
        { ...product, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clear = () => {
    setProducts([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { products, addProduct, clear, isLoaded };
};
