import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { getPaginationRange, getSearchParams, paginationSchema } from "@/app/api/_lib/pagination";
import {
  assertDatabaseResult,
  mapProduct,
  productRow,
  safeSearch,
  type DatabaseRow,
} from "@/app/api/_lib/shopee";
import { productSchema } from "@/features/products/schemas/product.schema";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { page, pageSize, search, brand } = listSchema.parse(getSearchParams(request));
    const { supabase } = await requireUser();
    const { from, to } = getPaginationRange(page, pageSize);
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    const normalizedSearch = safeSearch(search ?? "");

    if (normalizedSearch) {
      query = query.or(
        `name.ilike.%${normalizedSearch}%,brand.ilike.%${normalizedSearch}%,size.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%`,
      );
    }
    if (brand && brand !== "all") query = query.eq("brand", brand);

    const { data, error, count } = await query.range(from, to).abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess({
      items: (data ?? []).map((row) => mapProduct(row as DatabaseRow)),
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = productSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.from("products").insert(productRow(input));
    assertDatabaseResult(error);
    return apiSuccess(null, 201);
  } catch (error) {
    return apiError(error);
  }
}
