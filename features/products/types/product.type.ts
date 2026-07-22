export type { Product } from "@/types/domain";
import type { PageRequest } from "@/types/pagination";

export interface ProductListParams extends PageRequest {
  search?: string;
  brand?: string;
}

export interface ProductSummary {
  total: number;
  totalCapital: number;
  totalTarget: number;
  totalStock: number;
  inventoryCapital: number;
}
