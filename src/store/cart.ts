import { create } from "zustand";

export type CartItem = Readonly<{
  id: string;
  name: string;
  price: number;
  qty: number;
  storeId: string;
  imageUrl?: string;
  isPodEnabled?: boolean;
  currency?: "SOL" | "USDC" | "USD";
}>;

type CartState = Readonly<{
  items: CartItem[];
  solPrice: number | null;
  lastSolPriceFetch: number;
  isFetchingSolPrice: boolean;
  add(item: Omit<CartItem, "qty">, qty?: number): void;
  remove(id: string): void;
  clear(): void;
  updateQty(id: string, qty: number): void;
  total(): number;
  fetchSolPrice(): Promise<void>;
}>;

export const useCart = create<CartState>((set, get) => ({
  items: [],
  solPrice: null,
  lastSolPriceFetch: 0,
  isFetchingSolPrice: false,
  add: (item, qty = 1) => {
    const items = get().items.slice();
    const index = items.findIndex((i) => i.id === item.id);
    if (index === -1) {
      items.push({ ...item, qty });
    } else {
      const next = { ...items[index], qty: items[index].qty + qty };
      items[index] = next;
    }
    set({ items });
  },
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
  updateQty: (id, qty) => {
    const items = get().items.map((i) => (i.id === id ? { ...i, qty } : i));
    set({ items });
  },
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
  fetchSolPrice: async () => {
    const now = Date.now();
    const { lastSolPriceFetch, solPrice, isFetchingSolPrice } = get();

    if (isFetchingSolPrice) {
      return;
    }

    // Cache for 60 seconds (Client-side cache)
    if (solPrice && (now - lastSolPriceFetch < 60000)) {
      return;
    }

    try {
      set({ isFetchingSolPrice: true });
      // Use our internal secure proxy (Handles Jupiter -> CoinGecko fallback on server)
      const res = await fetch("/api/price/sol");
      if (!res.ok) throw new Error(`Price proxy error: ${res.status}`);

      const data = await res.json();
      const price = Number(data.price);

      if (price && !isNaN(price)) {
        set({ solPrice: price, lastSolPriceFetch: now });
      } else {
        console.error("Invalid price data from proxy");
      }
    } catch (err) {
      console.error("Failed to fetch SOL price:", err);
    } finally {
      set({ isFetchingSolPrice: false });
    }
  }
}));
