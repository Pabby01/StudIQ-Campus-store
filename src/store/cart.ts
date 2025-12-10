import { create } from "zustand";

export type CartItem = Readonly<{
  id: string;
  name: string;
  price: number;
  qty: number;
  storeId: string;
  imageUrl?: string;
}>;

type CartState = Readonly<{
  items: CartItem[];
  add(item: Omit<CartItem, "qty">, qty?: number): void;
  remove(id: string): void;
  clear(): void;
  updateQty(id: string, qty: number): void;
  total(): number;
}>;

export const useCart = create<CartState>((set, get) => ({
  items: [],
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
}));

