import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { getPaginationRange, getSearchParams, paginationSchema } from "@/app/api/_lib/pagination";
import {
  assertDatabaseResult,
  mapSale,
  safeSearch,
  type DatabaseRow,
} from "@/app/api/_lib/shopee";
import { saleSchema } from "@/features/sales/schemas/sale.schema";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({ search: z.string().trim().max(100).optional() });
const saleInputSchema = z.object({ sale: saleSchema, adjustStock: z.boolean() });

export async function GET(request: Request) {
  try {
    const { page, pageSize, search } = listSchema.parse(getSearchParams(request));
    const { supabase } = await requireUser();
    const { from, to } = getPaginationRange(page, pageSize);
    let query = supabase
      .from("sales")
      .select("*", { count: "exact" })
      .order("sold_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    const normalizedSearch = safeSearch(search ?? "");
    if (normalizedSearch) {
      query = query.or(
        `order_number.ilike.%${normalizedSearch}%,product_name.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%`,
      );
    }
    const { data, error, count } = await query.range(from, to).abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess({
      items: (data ?? []).map((row) => mapSale(row as DatabaseRow)),
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
    const { sale, adjustStock } = saleInputSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("create_sale", {
      p_sale: sale,
      p_adjust_stock: adjustStock,
    });
    assertDatabaseResult(error);
    return apiSuccess(null, 201);
  } catch (error) {
    return apiError(error);
  }
}
