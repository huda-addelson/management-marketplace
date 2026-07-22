import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { useDecantStore } from "@/store/decant.store";
import { useFeeStore } from "@/store/fee.store";
import { useProductStore } from "@/store/product.store";
import { useSaleStore } from "@/store/sale.store";
import { useSettingsStore } from "@/store/settings.store";
import type { AppSettings, InitialData } from "@/types/domain";

import { settingsUpdateSchema } from "../schemas/settings.schema";

export async function bootstrapData(initialData: InitialData) {
  if (!isSupabaseConfigured) return null;
  return apiRequest<null>(API_ENDPOINTS.settings.bootstrap, {
    method: "POST",
    body: JSON.stringify(initialData),
  });
}

export async function getSettings(signal?: AbortSignal): Promise<AppSettings> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.settings.root, { signal });
  return useSettingsStore.getState().settings;
}

export async function updateSettings(input: Partial<AppSettings>) {
  const settings = settingsUpdateSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.settings.root, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }
  useSettingsStore.getState().updateSettings(settings);
  return null;
}

export async function resetData(initialData: InitialData) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.settings.reset, {
      method: "POST",
      body: JSON.stringify(initialData),
    });
  }
  useProductStore.getState().resetProducts();
  useSaleStore.getState().resetSales();
  useFeeStore.getState().resetFees();
  useDecantStore.getState().resetDecants();
  useSettingsStore.getState().resetSettings();
  return null;
}
