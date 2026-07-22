import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, numberValue } from "@/app/api/_lib/shopee";
import { productSchema } from "@/features/products/schemas/product.schema";

export async function POST(request: Request) {
  try {
    const products = z.array(productSchema).max(100).parse(await request.json());
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("import_products_batch", { p_products: products });
    assertDatabaseResult(error);
    return apiSuccess(numberValue(data));
  } catch (error) {
    return apiError(error);
  }
}
