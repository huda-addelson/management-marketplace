"use client";

import {
  Archive,
  CalendarDays,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  FeeFormModal,
  useActiveFees,
  useArchiveFee,
  useFeePage,
  useFeeSummary,
  useUpdateFee,
} from "@/features/fees";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  FetchingIndicator,
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
} from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createInitialData } from "@/lib/seed-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AppSettings, FeeRule } from "@/types/domain";

import { useResetData, useUpdateSettings } from "../api/settings.mutation";
import { useSettings } from "../api/settings.query";

function StoreProfileForm({
  settings,
  onSave,
  onReset,
  disabled,
  resetDisabled,
  saving,
  resetting,
}: {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => Promise<void>;
  onReset: () => void;
  disabled: boolean;
  resetDisabled: boolean;
  saving: boolean;
  resetting: boolean;
}) {
  const [draft, setDraft] = useState(settings);
  const formDisabled = disabled || saving || resetting;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formDisabled) return;
    try {
      await onSave(draft);
      toast.success("Profil toko disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil gagal disimpan.");
    }
  };

  return (
    <form onSubmit={submit} className="paper-card h-fit rounded-[1.6rem] p-5 sm:p-6" aria-busy={saving || resetting}>
      <p className="eyebrow">Profil toko</p>
      <h2 className="font-display mt-2 text-2xl font-semibold">Identitas workspace</h2>
      <div className="mt-6 space-y-5">
        <Field label="Nama toko">
          <Input disabled={formDisabled} value={draft.storeName} onChange={(event) => setDraft((current) => ({ ...current, storeName: event.target.value }))} />
        </Field>
        <Field label="Nama pemilik" hint="Opsional, hanya tampil di workspace.">
          <Input disabled={formDisabled} value={draft.ownerName} onChange={(event) => setDraft((current) => ({ ...current, ownerName: event.target.value }))} />
        </Field>
        <Field label="Modal awal">
          <Input disabled={formDisabled} type="number" min="0" value={draft.openingCapital} onChange={(event) => setDraft((current) => ({ ...current, openingCapital: Math.max(0, Number(event.target.value) || 0) }))} />
        </Field>
        <Button type="submit" className="w-full" disabled={formDisabled}>
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Menyimpan..." : "Simpan profil"}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper-muted)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--forest)]" />
          <div>
            <p className="text-sm font-bold">Data tetap di bawah kendali Anda</p>
            <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">Setiap koleksi diambil per halaman. Mode lokal tersimpan di browser, sedangkan mode Supabase menggunakan tabel dengan RLS.</p>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-4 w-full text-[var(--danger)] hover:text-[var(--danger)]"
        disabled={resetDisabled || saving || resetting}
        onClick={onReset}
      >
        <RotateCcw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
        {resetting ? "Mereset data..." : "Reset data awal"}
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const archiveFeeMutation = useArchiveFee();
  const updateFeeMutation = useUpdateFee();
  const resetDataMutation = useResetData();
  const updateSettingsMutation = useUpdateSettings();
  const settingsQuery = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeeRule | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const feePageQuery = useFeePage({ page, pageSize, showArchived });
  const feeSummaryQuery = useFeeSummary();
  const activeFeesQuery = useActiveFees();
  const settings = settingsQuery.data;
  const feePage = feePageQuery.data;
  const feeSummary = feeSummaryQuery.data;
  const visibleFees = feePage?.items ?? [];
  const feePageReady = feePageQuery.isSuccess && !feePageQuery.isPlaceholderData;
  const feeReferenceLoaded = activeFeesQuery.data !== undefined;
  const feeReferenceReady = feeReferenceLoaded && !activeFeesQuery.isError;
  const resetReady =
    settingsQuery.isSuccess &&
    feePageReady &&
    feeSummaryQuery.isSuccess &&
    feeReferenceReady;
  const feeActionPending =
    archiveFeeMutation.isPending || updateFeeMutation.isPending || resetDataMutation.isPending;
  const feeActionsDisabled = !feePageReady || !feeReferenceReady || feeActionPending;
  const canOpenFeeForm = feeReferenceReady && !feeActionPending;
  const archivingFeeId = archiveFeeMutation.isPending
    ? archiveFeeMutation.variables
    : undefined;
  const updatingFeeId = updateFeeMutation.isPending
    ? updateFeeMutation.variables?.id
    : undefined;

  const openCreate = () => {
    if (!canOpenFeeForm) return;
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (fee: FeeRule) => {
    if (feeActionsDisabled) return;
    setEditing(fee);
    setModalOpen(true);
  };

  const archive = async (fee: FeeRule) => {
    if (feeActionsDisabled) return;
    if (!window.confirm(`Arsipkan potongan “${fee.name}”? Transaksi lama tidak akan berubah.`)) return;
    try {
      await archiveFeeMutation.mutateAsync(fee.id);
      if (visibleFees.length === 1 && page > 1) setPage((current) => current - 1);
      toast.success("Potongan diarsipkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Potongan gagal diarsipkan.");
    }
  };

  const reset = async () => {
    if (
      !resetReady ||
      resetDataMutation.isPending ||
      updateSettingsMutation.isPending ||
      archiveFeeMutation.isPending ||
      updateFeeMutation.isPending
    ) return;
    if (!window.confirm("Reset seluruh produk, penjualan, potongan, dan kalkulator ke data awal spreadsheet?")) return;
    try {
      await resetDataMutation.mutateAsync(createInitialData());
      setPage(1);
      toast.success("Workspace dikembalikan ke data awal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Workspace gagal direset.");
    }
  };

  const saveSettings = async (updates: Partial<AppSettings>) => {
    if (!settingsQuery.isSuccess || updateSettingsMutation.isPending || resetDataMutation.isPending) return;
    await updateSettingsMutation.mutateAsync(updates);
  };

  const toggleFee = async (fee: FeeRule, active: boolean) => {
    if (feeActionsDisabled) return;
    try {
      await updateFeeMutation.mutateAsync({ id: fee.id, input: { active } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status potongan gagal diubah.");
    }
  };

  const header = (
    <PageHeader
      eyebrow="Control room"
      title="Pengaturan yang bisa berubah tanpa merusak sejarah."
      description="Tarif baru menghitung ulang rekomendasi harga saat ini. Setiap penjualan tetap menyimpan potongan pada saat transaksi dibuat."
      actions={
        <Button onClick={openCreate} disabled={!canOpenFeeForm}>
          <Plus className="h-4 w-4" /> Tambah potongan
        </Button>
      }
    />
  );

  const hardFailure = settingsQuery.isLoadingError
    ? {
        title: "Profil toko belum berhasil dimuat.",
        error: settingsQuery.error,
        retry: settingsQuery.refetch,
      }
    : feePageQuery.isLoadingError
      ? {
          title: "Daftar potongan belum berhasil dimuat.",
          error: feePageQuery.error,
          retry: feePageQuery.refetch,
        }
      : feeSummaryQuery.isLoadingError
        ? {
            title: "Ringkasan potongan belum berhasil dimuat.",
            error: feeSummaryQuery.error,
            retry: feeSummaryQuery.refetch,
          }
        : activeFeesQuery.isLoadingError
          ? {
              title: "Referensi potongan belum berhasil dimuat.",
              error: activeFeesQuery.error,
              retry: activeFeesQuery.refetch,
            }
          : null;

  if (hardFailure) {
    return (
      <>
        {header}
        <QueryErrorState
          title={hardFailure.title}
          error={hardFailure.error}
          onRetry={hardFailure.retry}
        />
      </>
    );
  }

  const initialPending =
    settingsQuery.isPending ||
    feePageQuery.isPending ||
    feeSummaryQuery.isPending ||
    activeFeesQuery.isPending;

  if (
    initialPending ||
    settings === undefined ||
    feePage === undefined ||
    feeSummary === undefined ||
    activeFeesQuery.data === undefined
  ) {
    return (
      <>
        {header}
        <QueryLoadingState
          title="Menyiapkan pengaturan toko..."
          description="Mengambil profil, daftar potongan, dan referensi perhitungan terbaru."
          cards={3}
        />
      </>
    );
  }

  const isFetching =
    settingsQuery.isFetching ||
    feePageQuery.isFetching ||
    feeSummaryQuery.isFetching ||
    activeFeesQuery.isFetching;
  const hasRefetchError =
    settingsQuery.isRefetchError ||
    feePageQuery.isRefetchError ||
    feeSummaryQuery.isRefetchError ||
    activeFeesQuery.isRefetchError;

  return (
    <>
      {header}

      {isFetching ? (
        <div className="mb-4 flex justify-end">
          <FetchingIndicator active label="Memperbarui pengaturan..." />
        </div>
      ) : null}

      {hasRefetchError ? (
        <div className="mb-4 space-y-2">
          {settingsQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Profil toko gagal diperbarui; data terakhir tetap ditampilkan."
              error={settingsQuery.error}
              onRetry={settingsQuery.refetch}
            />
          ) : null}
          {feePageQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Daftar potongan gagal diperbarui; data terakhir tetap ditampilkan."
              error={feePageQuery.error}
              onRetry={feePageQuery.refetch}
            />
          ) : null}
          {feeSummaryQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Ringkasan potongan gagal diperbarui; data terakhir tetap ditampilkan."
              error={feeSummaryQuery.error}
              onRetry={feeSummaryQuery.refetch}
            />
          ) : null}
          {activeFeesQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Referensi potongan gagal diperbarui; perubahan sementara dinonaktifkan."
              error={activeFeesQuery.error}
              onRetry={activeFeesQuery.refetch}
            />
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.5fr)]">
        <StoreProfileForm
          key={`${settings.storeName}-${settings.ownerName}-${settings.openingCapital}`}
          settings={settings}
          onSave={saveSettings}
          onReset={() => void reset()}
          disabled={!settingsQuery.isSuccess || resetDataMutation.isPending}
          resetDisabled={
            !resetReady ||
            updateSettingsMutation.isPending ||
            archiveFeeMutation.isPending ||
            updateFeeMutation.isPending
          }
          saving={updateSettingsMutation.isPending}
          resetting={resetDataMutation.isPending}
        />

        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] bg-[linear-gradient(145deg,var(--nav),#1b4c40)] p-5 text-white shadow-[0_16px_36px_rgba(13,35,29,0.16)] ring-1 ring-white/10">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-white/50">Default produk</p>
              <p className="mt-2 text-3xl font-bold">{formatPercent(feeSummary.productPercentage)}</p>
              <p className="mt-2 text-xs text-white/55">ditambah {formatCurrency(feeSummary.productFixed)} biaya tetap</p>
            </div>
            <div className="paper-card rounded-[1.35rem] p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[var(--ink-soft)]">Aturan tersimpan</p>
              <p className="mt-2 text-3xl font-bold">{feeSummary.total}</p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">Potongan bisa dioverride per produk</p>
            </div>
          </div>

          <div className="paper-card mt-4 overflow-hidden rounded-[1.6rem]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5">
              <div>
                <p className="eyebrow">CRUD potongan</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">Daftar biaya aktif</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
                <input type="checkbox" checked={showArchived} disabled={feePageQuery.isFetching || feeActionPending} onChange={(event) => { setShowArchived(event.target.checked); setPage(1); }} />
                Tampilkan arsip
              </label>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {visibleFees.length ? (
                visibleFees.map((fee) => (
                  <div key={fee.id} className="grid gap-4 p-5 transition-colors hover:bg-brand-soft/[0.18] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" aria-busy={archivingFeeId === fee.id || updatingFeeId === fee.id}>
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--paper-muted)]">
                        {fee.kind === "percentage" ? "%" : "Rp"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold">{fee.name}</p>
                          <Badge tone={fee.archivedAt ? "red" : fee.active ? "green" : "neutral"}>{fee.archivedAt ? "Arsip" : fee.active ? "Aktif" : "Nonaktif"}</Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                          {fee.kind === "percentage" ? formatPercent(fee.value) : formatCurrency(fee.value)} · per {fee.appliesPer === "order" ? "pesanan" : "item"}
                          {fee.capAmount ? ` · maks. ${formatCurrency(fee.capAmount)}` : ""}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-[var(--ink-soft)]">
                          <CalendarDays className="h-3 w-3" /> Berlaku {fee.effectiveFrom}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {!fee.archivedAt ? (
                        <>
                          {updatingFeeId === fee.id ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin text-[var(--ink-soft)]" /> : null}
                          <Switch checked={fee.active} disabled={feeActionsDisabled} onChange={(active) => void toggleFee(fee, active)} label="" />
                          <Button variant="ghost" size="icon" disabled={feeActionsDisabled} onClick={() => openEdit(fee)} aria-label={`Edit ${fee.name}`}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" disabled={feeActionsDisabled} onClick={() => void archive(fee)} aria-label={archivingFeeId === fee.id ? `Mengarsipkan ${fee.name}` : `Arsipkan ${fee.name}`}>
                            {archivingFeeId === fee.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : feePageQuery.isPlaceholderData ? (
                <QueryLoadingState compact title="Memuat halaman potongan..." />
              ) : (
                <QueryEmptyState
                  compact
                  title={showArchived ? "Belum ada potongan tersimpan." : "Belum ada potongan aktif."}
                  description={showArchived ? "Tambahkan potongan pertama untuk mulai mengatur tarif." : "Tambahkan potongan atau tampilkan arsip untuk melihat tarif lama."}
                />
              )}
            </div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={feePage.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        </div>
      </section>

      {feeReferenceLoaded && (!editing || feePageReady) && !resetDataMutation.isPending ? (
        <FeeFormModal
          key={modalOpen ? editing?.id ?? "new-fee" : "closed-fee"}
          open={modalOpen}
          fee={editing}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
