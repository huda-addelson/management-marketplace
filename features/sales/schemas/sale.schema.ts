import { z } from "zod";

const appliedFeeSchema = z.object({
  feeId: z.string(),
  name: z.string(),
  kind: z.enum(["percentage", "fixed"]),
  value: z.number(),
  amount: z.number(),
});

export const saleSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  soldAt: z.string(),
  source: z.enum(["manual", "import"]),
  calculationMode: z.enum(["estimated", "actual"]),
  stockAdjusted: z.boolean(),
  stockDelta: z.number().int().min(0).optional(),
  productId: z.string().nullable(),
  productName: z.string().min(1),
  sku: z.string(),
  quantity: z.number().int().positive(),
  unitSellingPrice: z.number().min(0),
  grossRevenue: z.number(),
  receivedAmount: z.number(),
  unitCapitalCost: z.number().min(0),
  totalCapitalCost: z.number().min(0),
  extraCost: z.number().min(0),
  totalFees: z.number(),
  profit: z.number(),
  feeSnapshot: z.array(appliedFeeSchema),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
