import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, mapProduct, type DatabaseRow } from "@/app/api/_lib/shopee";
import type { Product } from "@/types/domain";
import { REFERENCE_PAGE_SIZE } from "@/types/pagination";

const matchesSchema = z.object({
  skus: z.array(z.string()).max(100),
  names: z.array(z.string()).max(100),
});

export async function POST(request: Request) {
  try {
    const { skus, names } = matchesSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const results = new Map<string, Product>();
    const { data, error } = await supabase.rpc("find_import_products", {
      p_skus: skus,
      p_names: names,
      p_limit: REFERENCE_PAGE_SIZE,
    });
    assertDatabaseResult(error);
    for (const row of data ?? []) {
      const product = mapProduct(row as DatabaseRow);
      results.set(product.id, product);
    }
    return apiSuccess(Array.from(results.values()));
  } catch (error) {
    return apiError(error);
  }
}
