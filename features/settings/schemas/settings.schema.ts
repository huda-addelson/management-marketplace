import { z } from "zod";

import { decantSchema, vialSchema } from "@/features/decants/schemas/decant.schema";
import { feeSchema } from "@/features/fees/schemas/fee.schema";
import { productSchema } from "@/features/products/schemas/product.schema";
import { saleSchema } from "@/features/sales/schemas/sale.schema";

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1),
  ownerName: z.string(),
  openingCapital: z.number().min(0),
  currency: z.literal("IDR"),
  productRounding: z.literal("nearest-rupiah"),
  decantRoundingStep: z.number().positive(),
});

export const settingsUpdateSchema = settingsSchema.partial();

export const initialDataSchema = z.object({
  version: z.number().int().positive(),
  fees: z.array(feeSchema).max(500),
  products: z.array(productSchema).max(5_000),
  vialCosts: z.array(vialSchema).max(500),
  decants: z.array(decantSchema).max(1_000),
  sales: z.array(saleSchema).max(5_000),
  settings: settingsSchema,
  updatedAt: z.string(),
});
