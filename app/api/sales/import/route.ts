import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, numberValue } from "@/app/api/_lib/shopee";
import { saleSchema } from "@/features/sales/schemas/sale.schema";

const importSchema = z.object({ sales: z.array(saleSchema).max(100), adjustStock: z.boolean() });

export async function POST(request: Request) {
  try {
    const { sales, adjustStock } = importSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("import_sales_batch", {
      p_sales: sales,
      p_adjust_stock: adjustStock,
    });
    assertDatabaseResult(error);
    return apiSuccess(numberValue(data));
  } catch (error) {
    return apiError(error);
  }
}
