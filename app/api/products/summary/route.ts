import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, numberValue, rpcObject } from "@/app/api/_lib/shopee";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("get_product_summary").abortSignal(request.signal);
    assertDatabaseResult(error);
    const row = rpcObject(data);
    return apiSuccess({
      total: numberValue(row.total),
      totalCapital: numberValue(row.total_capital),
      totalTarget: numberValue(row.total_target),
      totalStock: numberValue(row.total_stock),
      inventoryCapital: numberValue(row.inventory_capital),
    });
  } catch (error) {
    return apiError(error);
  }
}
