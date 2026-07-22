import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import {
  arrayValue,
  assertDatabaseResult,
  mapProduct,
  numberValue,
  rpcObject,
  stringValue,
  type DatabaseRow,
} from "@/app/api/_lib/shopee";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("get_dashboard_summary").abortSignal(request.signal);
    assertDatabaseResult(error);
    const row = rpcObject(data);
    return apiSuccess({
      productCount: numberValue(row.product_count),
      catalogCapital: numberValue(row.catalog_capital),
      catalogTargetProfit: numberValue(row.catalog_target_profit),
      inventoryCapital: numberValue(row.inventory_capital),
      totalStock: numberValue(row.total_stock),
      salesCount: numberValue(row.sales_count),
      salesRevenue: numberValue(row.sales_revenue),
      realizedProfit: numberValue(row.realized_profit),
      totalFees: numberValue(row.total_fees),
      lowStockCount: numberValue(row.low_stock_count),
      brandChart: arrayValue(row.brand_chart).map((item) => {
        const metric = item as DatabaseRow;
        return {
          brand: stringValue(metric.brand),
          modal: numberValue(metric.modal),
          target: numberValue(metric.target),
        };
      }),
      topProducts: arrayValue(row.top_products).map((item) => mapProduct(item as DatabaseRow)),
      lowStockProducts: arrayValue(row.low_stock_products).map((item) => mapProduct(item as DatabaseRow)),
    });
  } catch (error) {
    return apiError(error);
  }
}
