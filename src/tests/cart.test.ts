import { describe, expect, it } from "vitest";
import { useCart } from "@/store/cart";

describe("cart store", () => {
  it("adds and totals items", () => {
    const cart = useCart.getState();
    cart.clear();
    cart.add({ id: "a", name: "Item A", price: 10 });
    cart.add({ id: "b", name: "Item B", price: 5 }, 2);
    expect(useCart.getState().total()).toBe(20);
  });
});

