import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  university: z.string().min(2),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  address: z.string().min(10), // Allow both Solana addresses and civic_* placeholders
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  civic_user_id: z.string().optional().nullable(),
  verified_email: z.boolean().optional(),
  school: z.string().min(2),
  campus: z.string().min(2),
  level: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  referralCode: z.string().length(6).optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(2),
  lat: z.number(),
  lon: z.number(),
  bannerUrl: z.string().url().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  deliveryNotes: z.string().max(500).optional(),
});

export const updateStoreSchema = createStoreSchema.extend({ id: z.string().min(1) });

export const createProductSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  price: z.number().positive(),
  currency: z.enum(["SOL", "USDC"]).default("SOL"),
  priceNgn: z.number().positive().optional().nullable(),
  inventory: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(), // Keep for backward compatibility
  images: z.array(z.string().url()).min(0).max(10).optional(),
  isPodEnabled: z.boolean().default(false).optional(),
  originalPrice: z.number().positive().optional().nullable(),
});

export const updateProductSchema = createProductSchema.extend({ id: z.string().min(1) });

export const checkoutCreateSchema = z.object({
  buyer: z.string().min(32),
  storeId: z.string().min(1),
  items: z.array(
    z.object({ productId: z.string().min(1), qty: z.number().int().positive() })
  ).min(1),
  currency: z.enum(["SOL", "USDC"]),
  deliveryMethod: z.enum(["shipping", "pickup"]),
  deliveryDetails: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
    city: z.string().min(2),
    zip: z.string().min(3),
    fee: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  }),
  paymentMethod: z.enum(["solana", "pod"]).optional(),
  buyerEmail: z.string().email(),
});

export const awardPointsSchema = z.object({ address: z.string().min(32), points: z.number().int().positive(), reason: z.string().min(2) });
