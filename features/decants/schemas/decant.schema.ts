import { z } from "zod";

export const vialSchema = z.object({
  id: z.string().min(1),
  sizeMl: z.number().positive(),
  cost: z.number().min(0),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const vialUpdateSchema = vialSchema.partial().omit({ id: true });

export const decantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  concentration: z.string(),
  fullBottleCost: z.number().min(0),
  bottleVolumeMl: z.number().positive(),
  decantSizeMl: z.number().positive(),
  vialCostId: z.string().nullable(),
  bubbleWrapCost: z.number().min(0),
  stickerCost: z.number().min(0),
  cardCost: z.number().min(0),
  targetProfit: z.number().min(0),
  wholesaleTwoDiscount: z.number().min(0).max(100),
  wholesaleThreeDiscount: z.number().min(0).max(100),
  feeOverrides: z.record(z.string(), z.boolean()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const decantUpdateSchema = decantSchema.partial().omit({ id: true });
