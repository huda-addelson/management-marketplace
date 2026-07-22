import type { Product } from "@/types/domain";

export interface BrandMetric {
  brand: string;
  modal: number;
  target: number;
}

export interface DashboardSummary {
  productCount: number;
  catalogCapital: number;
  catalogTargetProfit: number;
  inventoryCapital: number;
  totalStock: number;
  salesCount: number;
  salesRevenue: number;
  realizedProfit: number;
  totalFees: number;
  lowStockCount: number;
  brandChart: BrandMetric[];
  topProducts: Product[];
  lowStockProducts: Product[];
}
