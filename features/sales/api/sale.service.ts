import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { paginateArray } from "@/lib/pagination";
import { useSaleStore } from "@/store/sale.store";
import type { Sale } from "@/types/domain";
import type { PageResult } from "@/types/pagination";

import { saleSchema } from "../schemas/sale.schema";
import type { SaleListParams, SaleSummary } from "../types/sale.type";

function matches(sale: Sale, search = "") {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return true;
  return [sale.orderNumber, sale.productName, sale.sku].join(" ").toLocaleLowerCase().includes(query);
}

function pageParams(params: SaleListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) search.set("search", params.search);
  return search;
}

export async function getSalePage(
  params: SaleListParams,
  signal?: AbortSignal,
): Promise<PageResult<Sale>> {
  if (isSupabaseConfigured) {
    return apiRequest(`${API_ENDPOINTS.sales.root}?${pageParams(params)}`, { signal });
  }
  const sales = useSaleStore
    .getState()
    .sales.filter((sale) => matches(sale, params.search))
    .sort(
      (left, right) =>
        right.soldAt.localeCompare(left.soldAt) ||
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );
  return paginateArray(sales, params);
}

export async function getSaleSummary(signal?: AbortSignal): Promise<SaleSummary> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.sales.summary, { signal });
  const sales = useSaleStore.getState().sales;
  return {
    total: sales.length,
    grossRevenue: sales.reduce((sum, sale) => sum + sale.grossRevenue, 0),
    receivedAmount: sales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
    totalFees: sales.reduce((sum, sale) => sum + sale.totalFees, 0),
    profit: sales.reduce((sum, sale) => sum + sale.profit, 0),
  };
}

export async function createSale({ sale: input, adjustStock }: { sale: Sale; adjustStock: boolean }) {
  const sale = saleSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.sales.root, {
      method: "POST",
      body: JSON.stringify({ sale, adjustStock }),
    });
  }
  useSaleStore.getState().addSale(sale, adjustStock);
  return null;
}

export async function deleteSale(id: string) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.sales.detail(id), { method: "DELETE" });
  }
  const state = useSaleStore.getState();
  const sale = state.sales.find((item) => item.id === id);
  state.deleteSale(id, sale?.stockAdjusted ?? false);
  return null;
}

export async function importSales({ sales: input, adjustStock }: { sales: Sale[]; adjustStock: boolean }) {
  const sales = saleSchema.array().parse(input);
  if (!isSupabaseConfigured) return useSaleStore.getState().importSales(sales, adjustStock);

  let imported = 0;
  for (let index = 0; index < sales.length; index += 100) {
    imported += await apiRequest<number>(API_ENDPOINTS.sales.import, {
      method: "POST",
      body: JSON.stringify({ sales: sales.slice(index, index + 100), adjustStock }),
    });
  }
  return imported;
}
