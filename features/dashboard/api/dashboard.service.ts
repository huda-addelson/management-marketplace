import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { useProductStore } from "@/store/product.store";
import { useSaleStore } from "@/store/sale.store";

import type { DashboardSummary } from "../types/dashboard.type";

export async function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.dashboard, { signal });

  const products = useProductStore.getState().products;
  const sales = useSaleStore.getState().sales;
  const brands = new Map<string, { brand: string; modal: number; target: number }>();
  for (const product of products) {
    const brand = product.brand || "Tanpa brand";
    const current = brands.get(brand) ?? { brand, modal: 0, target: 0 };
    current.modal += product.capitalCost;
    current.target += product.targetProfit;
    brands.set(brand, current);
  }

  return {
    productCount: products.length,
    catalogCapital: products.reduce((sum, product) => sum + product.capitalCost, 0),
    catalogTargetProfit: products.reduce((sum, product) => sum + product.targetProfit, 0),
    inventoryCapital: products.reduce((sum, product) => sum + product.capitalCost * product.stock, 0),
    totalStock: products.reduce((sum, product) => sum + product.stock, 0),
    salesCount: sales.length,
    salesRevenue: sales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
    realizedProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
    totalFees: sales.reduce((sum, sale) => sum + sale.totalFees, 0),
    lowStockCount: products.filter((product) => product.stock <= product.lowStockThreshold).length,
    brandChart: Array.from(brands.values()).sort((left, right) => right.modal - left.modal).slice(0, 12),
    topProducts: [...products]
      .sort((left, right) => right.targetProfit - left.targetProfit || left.id.localeCompare(right.id))
      .slice(0, 5),
    lowStockProducts: products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .sort((left, right) => left.stock - right.stock || left.id.localeCompare(right.id))
      .slice(0, 5),
  };
}
