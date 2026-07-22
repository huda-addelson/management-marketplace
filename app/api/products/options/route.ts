import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { getSearchParams } from "@/app/api/_lib/pagination";
import { assertDatabaseResult, mapProduct, safeSearch, type DatabaseRow } from "@/app/api/_lib/shopee";

const optionsSchema = z.object({ search: z.string().trim().max(100).optional() });

export async function GET(request: Request) {
  try {
    const { search } = optionsSchema.parse(getSearchParams(request));
    const { supabase } = await requireUser();
    let query = supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(20);
    const normalizedSearch = safeSearch(search ?? "");
    if (normalizedSearch) {
      query = query.or(
        `name.ilike.%${normalizedSearch}%,brand.ilike.%${normalizedSearch}%,size.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%`,
      );
    }
    const { data, error } = await query.abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess((data ?? []).map((row) => mapProduct(row as DatabaseRow)));
  } catch (error) {
    return apiError(error);
  }
}
