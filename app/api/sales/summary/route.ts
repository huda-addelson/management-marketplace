import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, numberValue, rpcObject } from "@/app/api/_lib/shopee";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("get_sale_summary").abortSignal(request.signal);
    assertDatabaseResult(error);
    const row = rpcObject(data);
    return apiSuccess({
      total: numberValue(row.total),
      grossRevenue: numberValue(row.gross_revenue),
      receivedAmount: numberValue(row.received_amount),
      totalFees: numberValue(row.total_fees),
      profit: numberValue(row.profit),
    });
  } catch (error) {
    return apiError(error);
  }
}
