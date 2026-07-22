export type { Sale } from "@/types/domain";
import type { PageRequest } from "@/types/pagination";

export interface SaleListParams extends PageRequest {
  search?: string;
}

export interface SaleSummary {
  total: number;
  grossRevenue: number;
  receivedAmount: number;
  totalFees: number;
  profit: number;
}
