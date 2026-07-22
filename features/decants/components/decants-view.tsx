"use client";

import {
  Beaker,
  Boxes,
  CircleDollarSign,
  FlaskConical,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FetchingIndicator,
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
  TableLoadingRows,
} from "@/components/common/query-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { VialFormModal } from "./vial-form";
import { useActiveFees } from "@/features/fees/api/fee.query";
import { calculateDecant, resolveFees } from "@/features/pricing/utils/pricing.utils";
import { useSettings } from "@/features/settings/api/settings.query";
import { createId, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { DecantRecipe, FeeRule, VialCost } from "@/types/domain";

import {
  useCreateDecant,
  useDeleteDecant,
  useDeleteVial,
  useUpdateDecant,
} from "../api/decant.mutation";
import { useActiveVials, useDecantPage, useVialPage } from "../api/decant.query";

function DecantWorkspace({
  initialRecipe,
  fees,
  activeVials,
  roundingStep,
}: {
  initialRecipe: DecantRecipe;
  fees: FeeRule[];
  activeVials: VialCost[];
  roundingStep: number;
}) {
  const updateDecantMutation = useUpdateDecant();
  const deleteVialMutation = useDeleteVial();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [vialPageNumber, setVialPageNumber] = useState(1);
  const [vialPageSize, setVialPageSize] = useState(10);
  const [vialModalOpen, setVialModalOpen] = useState(false);
  const [editingVial, setEditingVial] = useState<VialCost | null>(null);
  const vialPageQuery = useVialPage({ page: vialPageNumber, pageSize: vialPageSize });
  const vialPage = vialPageQuery.data;
  const saving = updateDecantMutation.isPending;
  const deletingVialId = deleteVialMutation.isPending ? deleteVialMutation.variables : null;

  const vial = activeVials.find((item) => item.id === recipe.vialCostId);
  const enabledFees = useMemo(
    () => resolveFees(fees, recipe.feeOverrides, "decants"),
    [fees, recipe.feeOverrides],
  );
  const result = useMemo(() => {
    try {
      return calculateDecant(recipe, vial, enabledFees, roundingStep);
    } catch {
      return null;
    }
  }, [enabledFees, recipe, roundingStep, vial]);

  const update = <K extends keyof DecantRecipe>(key: K, value: DecantRecipe[K]) => {
    setRecipe((current) => ({ ...current, [key]: value }));
  };

  const updateNumber = (key: keyof DecantRecipe, value: string) => {
    update(key, Math.max(0, Number(value) || 0) as DecantRecipe[typeof key]);
  };

  const saveRecipe = async () => {
    if (updateDecantMutation.isPending) return;

    try {
      await updateDecantMutation.mutateAsync({ id: recipe.id, input: recipe });
      toast.success("Resep decant disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resep gagal disimpan.");
    }
  };

  const openVialCreate = () => {
    setEditingVial(null);
    setVialModalOpen(true);
  };

  const openVialEdit = (item: VialCost) => {
    setEditingVial(item);
    setVialModalOpen(true);
  };

  const removeVial = async (item: VialCost) => {
    if (deleteVialMutation.isPending) return;
    if (!window.confirm(`Hapus biaya vial ${item.sizeMl} ml? Resep yang menggunakannya perlu memilih vial baru.`)) return;
    try {
      await deleteVialMutation.mutateAsync(item.id);
      toast.success("Biaya vial dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Biaya vial gagal dihapus.");
    }
  };

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Modal per item" value={formatCurrency(result?.totalCapitalCost ?? 0)} detail={`${formatCurrency(result?.capitalPerMl ?? 0)} per ml`} icon={Beaker} accent="forest" />
        <MetricCard label="Harga jual normal" value={formatCurrency(result?.pricing.sellingPrice ?? 0)} detail={`Dibulatkan naik per ${formatCurrency(roundingStep)}`} icon={CircleDollarSign} accent="clay" />
        <MetricCard label="Profit bersih / item" value={formatCurrency(result?.pricing.actualProfit ?? 0)} detail={`Target awal ${formatCurrency(recipe.targetProfit)}`} icon={Sparkles} accent="amber" />
        <MetricCard label="Stok per botol" value={`${formatNumber(result?.stockPerBottle ?? 0)} pcs`} detail={`${recipe.bottleVolumeMl} ml ÷ ${recipe.decantSizeMl} ml`} icon={Boxes} accent="sage" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.25fr)]">
        <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Input resep</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Formula decant</h2>
            </div>
            <Button size="sm" disabled={saving} onClick={() => void saveRecipe()}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan" : "Simpan"}
            </Button>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Nama resep" className="sm:col-span-2">
              <Input value={recipe.name} onChange={(event) => update("name", event.target.value)} />
            </Field>
            <Field label="Konsentrasi">
              <Select value={recipe.concentration} onChange={(event) => update("concentration", event.target.value)}>
                <option value="EDP">EDP</option>
                <option value="EDT">EDT</option>
                <option value="Extrait">Extrait</option>
                <option value="Cologne">Cologne</option>
                <option value="Lainnya">Lainnya</option>
              </Select>
            </Field>
            <Field label="Ukuran vial">
              <Select
                value={recipe.vialCostId ?? ""}
                onChange={(event) => {
                  const selected = activeVials.find((item) => item.id === event.target.value);
                  setRecipe((current) => ({
                    ...current,
                    vialCostId: selected?.id ?? null,
                    decantSizeMl: selected?.sizeMl ?? current.decantSizeMl,
                  }));
                }}
              >
                <option value="">Tanpa vial</option>
                {activeVials.map((item) => (
                  <option key={item.id} value={item.id}>{item.sizeMl} ml · {formatCurrency(item.cost)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Harga full bottle">
              <Input type="number" min="0" value={recipe.fullBottleCost} onChange={(event) => updateNumber("fullBottleCost", event.target.value)} />
            </Field>
            <Field label="Isi botol (ml)">
              <Input type="number" min="1" value={recipe.bottleVolumeMl} onChange={(event) => updateNumber("bottleVolumeMl", event.target.value)} />
            </Field>
            <Field label="Ukuran decant (ml)">
              <Input type="number" min="1" value={recipe.decantSizeMl} onChange={(event) => updateNumber("decantSizeMl", event.target.value)} />
            </Field>
            <Field label="Target untung bersih">
              <Input type="number" min="0" value={recipe.targetProfit} onChange={(event) => updateNumber("targetProfit", event.target.value)} />
            </Field>
            <Field label="Bubble wrap / item">
              <Input type="number" min="0" value={recipe.bubbleWrapCost} onChange={(event) => updateNumber("bubbleWrapCost", event.target.value)} />
            </Field>
            <Field label="Stiker / item">
              <Input type="number" min="0" value={recipe.stickerCost} onChange={(event) => updateNumber("stickerCost", event.target.value)} />
            </Field>
            <Field label="Kartu ucapan / item" className="sm:col-span-2">
              <Input type="number" min="0" value={recipe.cardCost} onChange={(event) => updateNumber("cardCost", event.target.value)} />
            </Field>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">Potongan decant</p>
            <div className="space-y-2">
              {fees.map((fee) => {
                const checked = recipe.feeOverrides[fee.id] ?? fee.defaultForDecants;
                return (
                  <Switch
                    key={fee.id}
                    checked={checked}
                    onChange={(value) => update("feeOverrides", { ...recipe.feeOverrides, [fee.id]: value })}
                    label={fee.name}
                    description={fee.kind === "percentage" ? formatPercent(fee.value) : formatCurrency(fee.value)}
                  />
                );
              })}
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <article className="overflow-hidden rounded-[1.6rem] bg-[linear-gradient(145deg,var(--nav)_0%,#19483d_100%)] text-white shadow-[0_22px_60px_rgba(13,35,29,0.18)] ring-1 ring-white/10">
            <div className="subtle-grid p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Harga siap pasang</p>
                  <p className="font-display mt-2 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{formatCurrency(result?.pricing.sellingPrice ?? 0)}</p>
                  <p className="mt-3 text-sm text-white/[0.58]">Uang diterima {formatCurrency(result?.pricing.receivedAmount ?? 0)}</p>
                </div>
                <Badge className="bg-white/[0.12] text-white">{formatPercent(result?.pricing.totalPercentage ?? 0)} fee</Badge>
              </div>

              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
                <div className="bg-black/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">Modal parfum</p><p className="mt-2 font-bold">{formatCurrency(result?.perfumeCapital ?? 0)}</p></div>
                <div className="bg-black/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">Vial + tambahan</p><p className="mt-2 font-bold">{formatCurrency((vial?.cost ?? 0) + (result?.additionalCost ?? 0))}</p></div>
                <div className="bg-black/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">Profit aktual</p><p className="mt-2 font-bold text-[var(--mint-strong)]">{formatCurrency(result?.pricing.actualProfit ?? 0)}</p></div>
              </div>
            </div>
          </article>

          <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="eyebrow">Breakdown fee</p><h2 className="font-display mt-2 text-2xl font-semibold">Potongan per item</h2></div>
              <ReceiptText className="h-6 w-6 text-[var(--clay)]" />
            </div>
            <div className="mt-5 divide-y divide-[var(--line)]">
              {result?.pricing.fees.map((fee) => (
                <div key={fee.feeId} className="flex items-center justify-between py-3 text-sm"><span className="text-[var(--ink-soft)]">{fee.name}</span><strong>{formatCurrency(Math.round(fee.amount))}</strong></div>
              ))}
              <div className="flex items-center justify-between py-3 text-sm"><span className="font-bold">Total potongan</span><strong className="text-[var(--clay-dark)]">{formatCurrency(result?.pricing.totalFees ?? 0)}</strong></div>
            </div>
          </article>

          <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><p className="eyebrow">Harga grosir</p><h2 className="font-display mt-2 text-2xl font-semibold">Hemat tanpa minus</h2></div>
              <PackagePlus className="h-6 w-6 text-[var(--forest)]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-4 transition hover:border-[var(--line-strong)] hover:bg-white">
                <Field label="Diskon 2 pcs (%)"><Input type="number" min="0" max="99" value={recipe.wholesaleTwoDiscount} onChange={(event) => updateNumber("wholesaleTwoDiscount", event.target.value)} /></Field>
                <p className="mt-4 text-xl font-bold">{formatCurrency(result?.wholesaleTwoPrice ?? 0)} <span className="text-xs font-medium text-[var(--ink-soft)]">/ pcs</span></p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Profit order: {formatCurrency(result?.wholesaleTwoProfit ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-4 transition hover:border-[var(--line-strong)] hover:bg-white">
                <Field label="Diskon 3 pcs (%)"><Input type="number" min="0" max="99" value={recipe.wholesaleThreeDiscount} onChange={(event) => updateNumber("wholesaleThreeDiscount", event.target.value)} /></Field>
                <p className="mt-4 text-xl font-bold">{formatCurrency(result?.wholesaleThreePrice ?? 0)} <span className="text-xs font-medium text-[var(--ink-soft)]">/ pcs</span></p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Profit order: {formatCurrency(result?.wholesaleThreeProfit ?? 0)}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <article className="paper-card overflow-hidden rounded-[1.6rem]">
          <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
            <div><p className="eyebrow">Biaya kemasan</p><h2 className="font-display mt-2 text-2xl font-semibold">Tabel vial & label</h2></div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <FetchingIndicator active={vialPage !== undefined && vialPageQuery.isFetching} label="Memperbarui vial..." />
              <Button size="sm" onClick={openVialCreate}><Plus className="h-3.5 w-3.5" /> Tambah</Button>
            </div>
          </div>
          {vialPage !== undefined && vialPageQuery.isError ? (
            <QueryErrorState
              compact
              className="mx-5 mb-5 sm:mx-6"
              title="Daftar vial terbaru gagal dimuat."
              description="Data vial yang terakhir berhasil dimuat tetap ditampilkan."
              error={vialPageQuery.error}
              onRetry={() => vialPageQuery.refetch()}
            />
          ) : null}
          <div className="overflow-x-auto border-t border-[var(--line)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--paper-muted)] text-[0.65rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]"><tr><th className="px-4 py-3">Ukuran</th><th className="px-4 py-3">Biaya</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-[var(--line)]">
                {vialPage === undefined && vialPageQuery.isError ? (
                  <tr>
                    <td colSpan={3} className="p-4">
                      <QueryErrorState
                        compact
                        title="Daftar vial gagal dimuat."
                        error={vialPageQuery.error}
                        onRetry={() => vialPageQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : vialPage === undefined ? (
                  <TableLoadingRows columns={3} />
                ) : vialPage.items.length ? (
                  vialPage.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3.5"><span className="font-bold">{item.sizeMl} ml</span>{!item.active ? <Badge className="ml-2">Nonaktif</Badge> : null}</td>
                      <td className="px-4 py-3.5 font-medium">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" disabled={deleteVialMutation.isPending} onClick={() => openVialEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-[var(--danger)]"
                            disabled={deleteVialMutation.isPending}
                            aria-label={deletingVialId === item.id ? `Menghapus vial ${item.sizeMl} ml` : `Hapus vial ${item.sizeMl} ml`}
                            onClick={() => void removeVial(item)}
                          >
                            {deletingVialId === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>
                      <QueryEmptyState
                        compact
                        title="Belum ada biaya vial."
                        description="Tambahkan ukuran vial pertama untuk melengkapi modal kemasan decant."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {vialPage !== undefined ? (
            <PaginationControls
              page={vialPageNumber}
              pageSize={vialPageSize}
              total={vialPage.total}
              onPageChange={setVialPageNumber}
              onPageSizeChange={(size) => { setVialPageSize(size); setVialPageNumber(1); }}
            />
          ) : null}
        </article>

        <article className="overflow-hidden rounded-[1.6rem] bg-[linear-gradient(145deg,#f16d4b,#d95032)] text-white shadow-[0_20px_52px_rgba(201,79,49,0.2)] ring-1 ring-white/20">
          <div className="p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/[0.58]">Rekap satu botol</p>
            <p className="font-display mt-3 text-3xl font-semibold">{recipe.name}</p>
            <div className="mt-7 space-y-4">
              <div className="flex items-end justify-between border-b border-white/[0.18] pb-4"><span className="text-sm text-white/65">Perkiraan omzet</span><strong className="text-2xl">{formatCurrency(result?.bottleRevenue ?? 0)}</strong></div>
              <div className="flex items-end justify-between"><span className="text-sm text-white/65">Total cuan</span><strong className="text-2xl">{formatCurrency(result?.bottleProfit ?? 0)}</strong></div>
            </div>
            <p className="mt-7 rounded-2xl bg-black/10 p-4 text-xs leading-5 text-white/70">Asumsi seluruh isi botol terjual pada harga normal, tanpa sisa cairan dan tanpa perubahan fee.</p>
          </div>
        </article>
      </section>

      <VialFormModal
        key={vialModalOpen ? editingVial?.id ?? "new-vial" : "closed-vial"}
        open={vialModalOpen}
        vial={editingVial}
        onClose={() => setVialModalOpen(false)}
      />
    </>
  );
}

export default function DecantPage() {
  const createDecantMutation = useCreateDecant();
  const deleteDecantMutation = useDeleteDecant();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState("");
  const decantPageQuery = useDecantPage({ page, pageSize });
  const feesQuery = useActiveFees();
  const activeVialsQuery = useActiveVials();
  const settingsQuery = useSettings();
  const decantPage = decantPageQuery.data;
  const fees = feesQuery.data;
  const activeVials = activeVialsQuery.data;
  const settings = settingsQuery.data;
  const requiredDataReady = decantPage !== undefined && fees !== undefined && activeVials !== undefined && settings !== undefined;
  const hasHardError =
    (decantPage === undefined && decantPageQuery.isError) ||
    (fees === undefined && feesQuery.isError) ||
    (activeVials === undefined && activeVialsQuery.isError) ||
    (settings === undefined && settingsQuery.isError);
  const hardError =
    (decantPage === undefined && decantPageQuery.isError ? decantPageQuery.error : null) ??
    (fees === undefined && feesQuery.isError ? feesQuery.error : null) ??
    (activeVials === undefined && activeVialsQuery.isError ? activeVialsQuery.error : null) ??
    (settings === undefined && settingsQuery.isError ? settingsQuery.error : null);
  const hasStaleError = requiredDataReady && (
    decantPageQuery.isError || feesQuery.isError || activeVialsQuery.isError || settingsQuery.isError
  );
  const isRefetching = requiredDataReady && (
    decantPageQuery.isFetching || feesQuery.isFetching || activeVialsQuery.isFetching || settingsQuery.isFetching
  );
  const decants = decantPage?.items;
  const recipe = decants?.find((item) => item.id === selectedId) ?? decants?.[0] ?? null;
  const recipeMutationPending = createDecantMutation.isPending || deleteDecantMutation.isPending;

  const createRecipe = async () => {
    if (!decantPage || !activeVials || recipeMutationPending) return;

    const now = new Date().toISOString();
    const firstVial = activeVials[0] ?? null;
    const next: DecantRecipe = {
      id: createId("decant"),
      name: `Resep Decant ${decantPage.total + 1}`,
      concentration: "EDP",
      fullBottleCost: 0,
      bottleVolumeMl: 100,
      decantSizeMl: firstVial?.sizeMl ?? 10,
      vialCostId: firstVial?.id ?? null,
      bubbleWrapCost: 0,
      stickerCost: 0,
      cardCost: 0,
      targetProfit: 10000,
      wholesaleTwoDiscount: 5,
      wholesaleThreeDiscount: 8,
      feeOverrides: {},
      createdAt: now,
      updatedAt: now,
    };
    try {
      await createDecantMutation.mutateAsync(next);
      setPage(1);
      setSelectedId(next.id);
      toast.success("Resep decant baru dibuat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resep gagal dibuat.");
    }
  };

  const removeRecipe = async () => {
    if (!recipe || !decants || recipeMutationPending || !window.confirm(`Hapus resep “${recipe.name}”?`)) return;
    try {
      await deleteDecantMutation.mutateAsync(recipe.id);
      setSelectedId("");
      if (decants.length === 1 && page > 1) setPage((current) => current - 1);
      toast.success("Resep decant dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resep gagal dihapus.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Decant laboratory"
        title="Pecah botol, bukan margin."
        description="Hitung modal per ml, kemasan, seluruh fee, harga grosir, dan potensi cuan satu botol tanpa spreadsheet terpisah."
        actions={requiredDataReady ? (
          <>
            {recipe ? (
              <Button variant="secondary" disabled={recipeMutationPending} onClick={() => void removeRecipe()}>
                {deleteDecantMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleteDecantMutation.isPending ? "Menghapus..." : "Hapus resep"}
              </Button>
            ) : null}
            <Button disabled={recipeMutationPending} onClick={() => void createRecipe()}>
              {createDecantMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {createDecantMutation.isPending ? "Membuat..." : "Resep baru"}
            </Button>
          </>
        ) : undefined}
      />

      {hasHardError ? (
        <QueryErrorState
          title="Laboratorium decant gagal dimuat."
          error={hardError}
          onRetry={() => Promise.all([
            decantPageQuery.refetch(),
            feesQuery.refetch(),
            activeVialsQuery.refetch(),
            settingsQuery.refetch(),
          ])}
        />
      ) : !requiredDataReady ? (
        <QueryLoadingState
          title="Menyiapkan laboratorium decant..."
          description="Memuat resep, fee aktif, biaya vial, dan pengaturan pembulatan sebelum menghitung."
        />
      ) : (
        <>
          {hasStaleError ? (
            <QueryErrorState
              compact
              className="mb-3"
              title="Pembaruan data decant belum berhasil."
              description="Data yang terakhir berhasil dimuat tetap digunakan. Coba lagi untuk mengambil perubahan terbaru."
              onRetry={() => Promise.all([
                ...(decantPageQuery.isError ? [decantPageQuery.refetch()] : []),
                ...(feesQuery.isError ? [feesQuery.refetch()] : []),
                ...(activeVialsQuery.isError ? [activeVialsQuery.refetch()] : []),
                ...(settingsQuery.isError ? [settingsQuery.refetch()] : []),
              ])}
            />
          ) : null}
          <FetchingIndicator active={isRefetching} className="mb-3" label="Memperbarui data decant..." />

          {decants?.length ? (
            <div className="mb-4 overflow-hidden rounded-[1rem] border border-[var(--line)] bg-white/65">
              <div className="hide-scrollbar flex gap-2 overflow-x-auto p-2">
                {decants.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`shrink-0 rounded-[0.8rem] border px-4 py-2.5 text-sm font-bold transition-all ${item.id === recipe?.id ? "border-[var(--nav)] bg-[var(--nav)] text-white shadow-md" : "border-[var(--line-strong)] bg-white/80 text-[var(--ink-soft)] hover:border-brand/35 hover:text-[var(--ink)]"}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={decantPage.total}
                onPageChange={(nextPage) => { setPage(nextPage); setSelectedId(""); }}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); setSelectedId(""); }}
              />
            </div>
          ) : null}

          {!recipe ? (
            <QueryEmptyState
              className="paper-card rounded-3xl"
              icon={FlaskConical}
              title="Belum ada resep decant."
              description="Buat resep pertama untuk mulai menghitung."
              action={(
                <Button disabled={recipeMutationPending} onClick={() => void createRecipe()}>
                  {createDecantMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {createDecantMutation.isPending ? "Membuat..." : "Buat resep"}
                </Button>
              )}
            />
          ) : (
            <DecantWorkspace
              key={recipe.id}
              initialRecipe={recipe}
              fees={fees}
              activeVials={activeVials}
              roundingStep={settings.decantRoundingStep}
            />
          )}
        </>
      )}
    </>
  );
}
