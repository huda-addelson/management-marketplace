"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FetchingIndicator, QueryErrorState, QueryLoadingState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { createId } from "@/lib/utils";
import type { FeeAppliesPer, FeeKind, FeeRule } from "@/types/domain";

import { useCreateFee, useUpdateFee } from "../api/fee.mutation";
import { useActiveFees } from "../api/fee.query";

interface FeeDraft {
  name: string;
  kind: FeeKind;
  value: number;
  appliesPer: FeeAppliesPer;
  capAmount: number | null;
  active: boolean;
  defaultForProducts: boolean;
  defaultForDecants: boolean;
  effectiveFrom: string;
}

const emptyDraft: FeeDraft = {
  name: "",
  kind: "percentage",
  value: 0,
  appliesPer: "item",
  capAmount: null,
  active: true,
  defaultForProducts: true,
  defaultForDecants: false,
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

export function FeeFormModal({
  open,
  fee,
  onClose,
}: {
  open: boolean;
  fee: FeeRule | null;
  onClose: () => void;
}) {
  const createFeeMutation = useCreateFee();
  const updateFeeMutation = useUpdateFee();
  const feesQuery = useActiveFees();
  const fees = feesQuery.data;
  const [draft, setDraft] = useState<FeeDraft>(() =>
    fee
      ? {
          name: fee.name,
          kind: fee.kind,
          value: fee.value,
          appliesPer: fee.appliesPer,
          capAmount: fee.capAmount,
          active: fee.active,
          defaultForProducts: fee.defaultForProducts,
          defaultForDecants: fee.defaultForDecants,
          effectiveFrom: fee.effectiveFrom,
        }
      : emptyDraft,
  );
  const saving = createFeeMutation.isPending || updateFeeMutation.isPending;
  const feesReady = fees !== undefined && !feesQuery.isError;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!fees || feesQuery.isError) {
      toast.error("Daftar potongan belum tersedia. Muat ulang sebelum menyimpan perubahan.");
      return;
    }
    if (!draft.name.trim() || draft.value < 0) {
      toast.error("Nama dan nilai potongan harus valid.");
      return;
    }
    if (draft.kind === "percentage" && draft.active) {
      const otherFees = fees.filter(
        (item) => item.id !== fee?.id && item.active && !item.archivedAt && item.kind === "percentage",
      );
      const productTotal = otherFees
        .filter((item) => item.defaultForProducts)
        .reduce((sum, item) => sum + item.value, draft.defaultForProducts ? draft.value : 0);
      const decantTotal = otherFees
        .filter((item) => item.defaultForDecants)
        .reduce((sum, item) => sum + item.value, draft.defaultForDecants ? draft.value : 0);
      if (productTotal >= 100 || decantTotal >= 100) {
        toast.error("Total potongan default harus kurang dari 100%.");
        return;
      }
    }

    try {
      const now = new Date().toISOString();
      const normalized = {
        ...draft,
        capAmount: draft.kind === "percentage" ? draft.capAmount : null,
      };
      if (fee) {
        await updateFeeMutation.mutateAsync({ id: fee.id, input: normalized });
        toast.success("Potongan diperbarui.");
      } else {
        await createFeeMutation.mutateAsync({
          id: createId("fee"),
          ...normalized,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Potongan ditambahkan.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Potongan gagal disimpan.");
    }
  };

  return (
    <Modal open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }} title={fee ? "Edit potongan" : "Tambah potongan"} description="Potongan aktif langsung memengaruhi rekomendasi harga, tetapi transaksi lama tetap memakai snapshot sebelumnya.">
      <form onSubmit={submit}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div className="sm:col-span-2">
            <FetchingIndicator active={fees !== undefined && feesQuery.isFetching} label="Memperbarui referensi potongan..." />
            {fees === undefined && feesQuery.isPending ? <QueryLoadingState compact title="Memuat referensi potongan..." /> : null}
            {feesQuery.isError ? <QueryErrorState compact title="Referensi potongan belum berhasil dimuat. Penyimpanan dinonaktifkan." error={feesQuery.error} onRetry={feesQuery.refetch} /> : null}
          </div>
          <Field label="Nama potongan" className="sm:col-span-2">
            <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Contoh: Affiliate" />
          </Field>
          <Field label="Jenis">
            <Select value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as FeeKind }))}>
              <option value="percentage">Persentase</option>
              <option value="fixed">Nominal tetap</option>
            </Select>
          </Field>
          <Field label={draft.kind === "percentage" ? "Persentase (%)" : "Nominal (Rp)"}>
            <Input type="number" min="0" step={draft.kind === "percentage" ? "0.01" : "1"} value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: Math.max(0, Number(event.target.value) || 0) }))} />
          </Field>
          <Field label="Dikenakan per">
            <Select value={draft.appliesPer} onChange={(event) => setDraft((current) => ({ ...current, appliesPer: event.target.value as FeeAppliesPer }))}>
              <option value="item">Item / kuantitas</option>
              <option value="order">Pesanan</option>
            </Select>
          </Field>
          <Field label="Batas maksimum" hint="Opsional. Kosongkan agar mengikuti rumus spreadsheet.">
            <Input type="number" min="0" disabled={draft.kind === "fixed"} value={draft.capAmount ?? ""} onChange={(event) => setDraft((current) => ({ ...current, capAmount: event.target.value ? Number(event.target.value) : null }))} placeholder="Tanpa batas" />
          </Field>
          <Field label="Mulai berlaku">
            <Input type="date" value={draft.effectiveFrom} onChange={(event) => setDraft((current) => ({ ...current, effectiveFrom: event.target.value }))} />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Switch checked={draft.active} onChange={(value) => setDraft((current) => ({ ...current, active: value }))} label="Potongan aktif" description="Potongan nonaktif tidak digunakan meskipun dipilih pada produk." />
            <Switch checked={draft.defaultForProducts} onChange={(value) => setDraft((current) => ({ ...current, defaultForProducts: value }))} label="Default untuk produk utama" />
            <Switch checked={draft.defaultForDecants} onChange={(value) => setDraft((current) => ({ ...current, defaultForDecants: value }))} label="Default untuk kalkulator decant" />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4 sm:px-7">
          <Button variant="ghost" disabled={saving} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={saving || !feesReady} aria-busy={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : feesQuery.isError ? "Referensi tidak tersedia" : !feesReady ? "Memuat potongan..." : "Simpan potongan"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
