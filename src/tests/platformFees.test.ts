import { describe, it, expect } from "vitest";
import { calculateFees } from "@/lib/platformFees";

describe("platform fee calculations", () => {
    it("calculates fee and payout correctly for 5 percent", () => {
        const { feeAmount, sellerPayout, feePercentage } = calculateFees(100, 5);
        expect(feePercentage).toBe(5);
        expect(feeAmount).toBeCloseTo(5);
        expect(sellerPayout).toBeCloseTo(95);
    });

    it("calculates fee and payout correctly for 2 percent", () => {
        const { feeAmount, sellerPayout, feePercentage } = calculateFees(250, 2);
        expect(feePercentage).toBe(2);
        expect(feeAmount).toBeCloseTo(5);
        expect(sellerPayout).toBeCloseTo(245);
    });
});
