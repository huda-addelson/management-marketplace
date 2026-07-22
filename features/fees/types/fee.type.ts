export type { FeeAppliesPer, FeeKind, FeeRule } from "@/types/domain";
import type { PageRequest } from "@/types/pagination";

export interface FeeListParams extends PageRequest {
  showArchived?: boolean;
}

export interface FeeSummary {
  total: number;
  productPercentage: number;
  productFixed: number;
}
