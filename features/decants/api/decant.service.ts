import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { paginateArray } from "@/lib/pagination";
import { useDecantStore } from "@/store/decant.store";
import type { DecantRecipe, VialCost } from "@/types/domain";
import type { PageRequest, PageResult } from "@/types/pagination";

import {
  decantSchema,
  decantUpdateSchema,
  vialSchema,
  vialUpdateSchema,
} from "../schemas/decant.schema";

const REFERENCE_LIMIT = 100;

function newestFirst<T extends { createdAt: string; id: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id);
}

function pageParams(params: PageRequest) {
  return new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
}

export async function getDecantPage(
  params: PageRequest,
  signal?: AbortSignal,
): Promise<PageResult<DecantRecipe>> {
  if (isSupabaseConfigured) {
    return apiRequest(`${API_ENDPOINTS.decants.root}?${pageParams(params)}`, { signal });
  }
  return paginateArray([...useDecantStore.getState().decants].sort(newestFirst), params);
}

export async function createDecant(input: DecantRecipe) {
  const decant = decantSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.decants.root, {
      method: "POST",
      body: JSON.stringify(decant),
    });
  }
  useDecantStore.getState().addDecant(decant);
  return null;
}

export async function updateDecant({ id, input }: { id: string; input: Partial<DecantRecipe> }) {
  const updates = decantUpdateSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.decants.detail(id), {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
  useDecantStore.getState().updateDecant(id, updates);
  return null;
}

export async function deleteDecant(id: string) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.decants.detail(id), { method: "DELETE" });
  }
  useDecantStore.getState().deleteDecant(id);
  return null;
}

export async function getVialPage(
  params: PageRequest,
  signal?: AbortSignal,
): Promise<PageResult<VialCost>> {
  if (isSupabaseConfigured) {
    return apiRequest(`${API_ENDPOINTS.vials.root}?${pageParams(params)}`, { signal });
  }
  return paginateArray([...useDecantStore.getState().vialCosts].sort(newestFirst), params);
}

export async function getActiveVials(signal?: AbortSignal): Promise<VialCost[]> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.vials.active, { signal });
  return useDecantStore
    .getState()
    .vialCosts.filter((vial) => vial.active)
    .sort((left, right) => left.sizeMl - right.sizeMl)
    .slice(0, REFERENCE_LIMIT);
}

export async function createVial(input: VialCost) {
  const vial = vialSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.vials.root, {
      method: "POST",
      body: JSON.stringify(vial),
    });
  }
  if (useDecantStore.getState().vialCosts.some((item) => item.sizeMl === vial.sizeMl)) {
    throw new Error(`Biaya vial ${vial.sizeMl} ml sudah tersedia.`);
  }
  useDecantStore.getState().addVial(vial);
  return null;
}

export async function updateVial({ id, input }: { id: string; input: Partial<VialCost> }) {
  const updates = vialUpdateSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.vials.detail(id), {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
  if (
    updates.sizeMl !== undefined &&
    useDecantStore.getState().vialCosts.some(
      (item) => item.id !== id && item.sizeMl === updates.sizeMl,
    )
  ) {
    throw new Error(`Biaya vial ${updates.sizeMl} ml sudah tersedia.`);
  }
  useDecantStore.getState().updateVial(id, updates);
  return null;
}

export async function deleteVial(id: string) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.vials.detail(id), { method: "DELETE" });
  }
  useDecantStore.getState().deleteVial(id);
  return null;
}
