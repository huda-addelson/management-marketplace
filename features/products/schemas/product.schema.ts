import { z } from "zod";

export const productSchema = z.object({
  id: z.string().min(1),
  brand: z.string().trim().min(1),
  size: z.string(),
  name: z.string().trim().min(1),
  sku: z.string(),
  capitalCost: z.number().min(0),
  targetProfit: z.number().min(0),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  feeOverrides: z.record(z.string(), z.boolean()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productUpdateSchema = productSchema.partial().omit({ id: true });
