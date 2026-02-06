import { SOLANA_CONFIG } from "./solana-config";

export const POINTS = {
    PROFILE_COMPLETE: 150,
    FIRST_PURCHASE: 100,
    PURCHASE_REWARD_PERCENT: 0.05, // 5%
    ORDER_COMPLETED: 10, // Seller
    PRODUCT_LISTED: 5, // Seller
    REVIEW: 10, // Buyer
    REVIEW_5_STAR: 25, // Seller
    REFERRAL: 100,
    MILESTONE_10_SALES: 50,
    MILESTONE_50_SALES: 100,
    MILESTONE_100_SALES: 500,
};

export const PLATFORM_WALLET = SOLANA_CONFIG.platformWallet;
