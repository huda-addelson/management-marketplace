import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, stringValue, type DatabaseRow } from "@/app/api/_lib/shopee";
import { REFERENCE_PAGE_SIZE } from "@/types/pagination";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .rpc("list_product_brands", { p_limit: REFERENCE_PAGE_SIZE })
      .abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess((data ?? []).map((row: DatabaseRow) => stringValue(row.brand)).filter(Boolean));
  } catch (error) {
    return apiError(error);
  }
}
