import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, numberValue, rpcObject } from "@/app/api/_lib/shopee";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("get_fee_summary").abortSignal(request.signal);
    assertDatabaseResult(error);
    const row = rpcObject(data);
    return apiSuccess({
      total: numberValue(row.total),
      productPercentage: numberValue(row.product_percentage),
      productFixed: numberValue(row.product_fixed),
    });
  } catch (error) {
    return apiError(error);
  }
}
