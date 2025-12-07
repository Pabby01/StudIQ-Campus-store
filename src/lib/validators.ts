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
  address: z.string().min(32),
  name: z.string().min(2),
  school: z.string().min(2),
  campus: z.string().min(2),
  level: z.string().min(1),
  phone: z.string().min(6),
});

export const createStoreSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(2),
  lat: z.number(),
  lon: z.number(),
  bannerUrl: z.string().url().optional(),
});

export const updateStoreSchema = createStoreSchema.extend({ id: z.string().min(1) });

export const createProductSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.number().positive(),
  inventory: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.extend({ id: z.string().min(1) });

export const checkoutCreateSchema = z.object({
  buyer: z.string().min(32),
  storeId: z.string().min(1),
  items: z.array(
    z.object({ productId: z.string().min(1), qty: z.number().int().positive() })
  ).min(1),
  currency: z.enum(["SOL", "USDC"]),
});

export const awardPointsSchema = z.object({ address: z.string().min(32), points: z.number().int().positive(), reason: z.string().min(2) });

