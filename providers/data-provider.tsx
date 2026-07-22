"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { FullScreenLoadingState, QueryErrorState } from "@/components/common/query-state";
import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { bootstrapData } from "@/features/settings/api/settings.service";
import { migrateLegacyLocalData } from "@/lib/local-data-migration";
import { persistStore } from "@/lib/local-storage-sync";
import { createInitialData } from "@/lib/seed-data";
import { useDecantStore } from "@/store/decant.store";
import { useFeeStore } from "@/store/fee.store";
import { useProductStore } from "@/store/product.store";
import { useSaleStore } from "@/store/sale.store";
import { useSettingsStore } from "@/store/settings.store";

import { useAuthContext } from "./auth-provider";

type SyncStatus = "idle" | "loading" | "saved" | "error";

interface DataContextValue {
  syncStatus: SyncStatus;
}

const DataContext = createContext<DataContextValue | null>(null);

function SetupError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <AddelsonLogo size={80} className="mx-auto mb-5" priority />
        <QueryErrorState
          title="Data toko belum berhasil disiapkan."
          error={error}
          onRetry={retry}
        />
        <p className="mt-3 text-center text-xs leading-5 text-[var(--ink-soft)]">
          Untuk instalasi Supabase baru, pastikan <code>supabase/schema.sql</code> sudah dijalankan.
        </p>
      </div>
    </div>
  );
}

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { mode, ready: authReady, user } = useAuthContext();
  const [hydrated, setHydrated] = useState(mode === "supabase");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    mode === "supabase" ? "loading" : "idle",
  );
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [setupError, setSetupError] = useState<unknown>(null);

  useEffect(() => {
    if (mode !== "local") return;
    let active = true;
    const hydrate = async () => {
      setHydrated(false);
      setSetupError(null);
      try {
        migrateLegacyLocalData();
        const unsubscribes = [
          persistStore({ name: "addelson-profit-products", select: (s) => s.products }, useProductStore),
          persistStore({ name: "addelson-profit-sales", select: (s) => s.sales }, useSaleStore),
          persistStore({ name: "addelson-profit-fees", select: (s) => s.fees }, useFeeStore),
          persistStore(
            {
              name: "addelson-profit-decants",
              select: (s) => ({ decants: s.decants, vialCosts: s.vialCosts }),
            },
            useDecantStore,
          ),
          persistStore({ name: "addelson-profit-settings", select: (s) => s.settings }, useSettingsStore),
        ];
        if (active) {
          setHydrated(true);
          return () => unsubscribes.forEach((unsub) => unsub());
        }
        unsubscribes.forEach((unsub) => unsub());
      } catch (error) {
        if (active) setSetupError(() => error);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [bootstrapAttempt, mode]);

  useEffect(() => {
    if (mode !== "supabase" || !user) return;
    let active = true;
    const start = async () => {
      setSyncStatus("loading");
      setSetupError(null);
      try {
        await bootstrapData(createInitialData());
        if (!active) return;
        await queryClient.invalidateQueries();
        setSyncStatus("saved");
      } catch (error) {
        if (active) {
          setSetupError(() => error);
          setSyncStatus("error");
        }
      }
    };
    void start();
    return () => {
      active = false;
    };
  }, [bootstrapAttempt, mode, queryClient, user?.id]);

  const failed = setupError !== null;
  const loading = !failed && (!authReady || (mode === "local" && !hydrated) || (mode === "supabase" && Boolean(user) && syncStatus === "loading"));

  return (
    <DataContext.Provider value={{ syncStatus }}>
      {failed ? (
        <SetupError error={setupError} retry={() => setBootstrapAttempt((attempt) => attempt + 1)} />
      ) : loading ? (
        <FullScreenLoadingState title="Menyiapkan data toko..." description="Memuat profil, tarif, katalog, dan transaksi terbaru." />
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext harus digunakan di dalam DataProvider.");
  }
  return context;
}
