import { initialDataSchema } from "@/features/settings/schemas/settings.schema";
import { useDecantStore } from "@/store/decant.store";
import { useFeeStore } from "@/store/fee.store";
import { useProductStore } from "@/store/product.store";
import { useSaleStore } from "@/store/sale.store";
import { useSettingsStore } from "@/store/settings.store";

const LEGACY_STORAGE_KEY = "addelson-profit-workspace";
const MIGRATION_MARKER_KEY = "addelson-profit-domain-stores-v1";

export function migrateLegacyLocalData() {
  if (typeof window === "undefined" || localStorage.getItem(MIGRATION_MARKER_KEY)) return;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_MARKER_KEY, "1");
    return;
  }

  try {
    const envelope = JSON.parse(raw) as { state?: unknown };
    const result = initialDataSchema.safeParse(envelope.state ?? envelope);
    if (!result.success) return;

    const data = result.data;
    useProductStore.getState().replaceProducts(data.products);
    useSaleStore.getState().replaceSales(data.sales);
    useFeeStore.getState().replaceFees(data.fees);
    useDecantStore.getState().replaceDecantData(data.decants, data.vialCosts);
    useSettingsStore.getState().replaceSettings(data.settings);
    localStorage.setItem(MIGRATION_MARKER_KEY, "1");
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Keep the legacy payload untouched so migration can be retried.
  }
}
