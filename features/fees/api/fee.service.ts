import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { paginateArray } from "@/lib/pagination";
import { useFeeStore } from "@/store/fee.store";
import type { FeeRule } from "@/types/domain";
import type { PageResult } from "@/types/pagination";

import { feeSchema, feeUpdateSchema } from "../schemas/fee.schema";
import type { FeeListParams, FeeSummary } from "../types/fee.type";

const REFERENCE_LIMIT = 100;

function newestFirst(left: FeeRule, right: FeeRule) {
  return right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id);
}

function pageParams(params: FeeListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.showArchived) search.set("showArchived", "true");
  return search;
}

export async function getFeePage(
  params: FeeListParams,
  signal?: AbortSignal,
): Promise<PageResult<FeeRule>> {
  if (isSupabaseConfigured) {
    return apiRequest(`${API_ENDPOINTS.fees.root}?${pageParams(params)}`, { signal });
  }
  const fees = useFeeStore
    .getState()
    .fees.filter((fee) => params.showArchived || !fee.archivedAt)
    .sort(newestFirst);
  return paginateArray(fees, params);
}

export async function getActiveFees(signal?: AbortSignal): Promise<FeeRule[]> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.fees.active, { signal });
  return useFeeStore
    .getState()
    .fees.filter((fee) => fee.active && !fee.archivedAt)
    .sort(newestFirst)
    .slice(0, REFERENCE_LIMIT);
}

export async function getFeeSummary(signal?: AbortSignal): Promise<FeeSummary> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.fees.summary, { signal });
  const fees = useFeeStore.getState().fees.filter((fee) => !fee.archivedAt);
  return {
    total: fees.length,
    productPercentage: fees
      .filter((fee) => fee.active && fee.defaultForProducts && fee.kind === "percentage")
      .reduce((sum, fee) => sum + fee.value, 0),
    productFixed: fees
      .filter((fee) => fee.active && fee.defaultForProducts && fee.kind === "fixed")
      .reduce((sum, fee) => sum + fee.value, 0),
  };
}

export async function createFee(input: FeeRule) {
  const fee = feeSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.fees.root, {
      method: "POST",
      body: JSON.stringify(fee),
    });
  }
  useFeeStore.getState().addFee(fee);
  return null;
}

export async function updateFee({ id, input }: { id: string; input: Partial<FeeRule> }) {
  const updates = feeUpdateSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.fees.detail(id), {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
  useFeeStore.getState().updateFee(id, updates);
  return null;
}

export async function archiveFee(id: string) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.fees.detail(id), { method: "DELETE" });
  }
  useFeeStore.getState().archiveFee(id);
  return null;
}
