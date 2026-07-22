import { z } from "zod";

export const feeSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  kind: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
  appliesPer: z.enum(["item", "order"]),
  capAmount: z.number().min(0).nullable(),
  active: z.boolean(),
  defaultForProducts: z.boolean(),
  defaultForDecants: z.boolean(),
  effectiveFrom: z.string(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const feeUpdateSchema = feeSchema.partial().omit({ id: true });
