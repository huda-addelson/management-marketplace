"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  FetchingIndicator,
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
} from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { useActiveFees } from "@/features/fees/api/fee.query";
import { calculateTargetPrice, resolveFees } from "@/features/pricing/utils/pricing.utils";
import { createId, formatCurrency, formatPercent } from "@/lib/utils";
import type { FeeRule, Product } from "@/types/domain";

import { useCreateProduct, useUpdateProduct } from "../api/product.mutation";

interface ProductDraft {
  brand: string;
  size: string;
  name: string;
  sku: string;
  capitalCost: number;
  targetProfit: number;
  stock: number;
  lowStockThreshold: number;
  feeOverrides: Record<string, boolean>;
}

const emptyDraft: ProductDraft = {
  brand: "",
  size: "",
  name: "",
  sku: "",
  capitalCost: 0,
  targetProfit: 0,
  stock: 0,
  lowStockThreshold: 3,
  feeOverrides: {},
};

function toDraft(product: Product | null): ProductDraft {
  if (!product) return emptyDraft;
  return {
    brand: product.brand,
    size: product.size,
    name: product.name,
    sku: product.sku,
    capitalCost: product.capitalCost,
    targetProfit: product.targetProfit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    feeOverrides: { ...product.feeOverrides },
  };
}

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const feesQuery = useActiveFees();
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(product));
  const saving = createProductMutation.isPending || updateProductMutation.isPending;
  const fees = feesQuery.data;
  const feesReady = fees !== undefined && !feesQuery.isError;

  const enabledFees = useMemo(() => {
    if (!fees || feesQuery.isError) return null;
    return resolveFees(fees, draft.feeOverrides, "products");
  }, [draft.feeOverrides, fees, feesQuery.isError]);
  const preview = useMemo(() => {
    if (!enabledFees) return null;
    try {
      return calculateTargetPrice({
        capitalCost: draft.capitalCost,
        targetProfit: draft.targetProfit,
        fees: enabledFees,
      });
    } catch {
      return null;
    }
  }, [draft.capitalCost, draft.targetProfit, enabledFees]);

  const updateNumber = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!fees || feesQuery.isError) {
      toast.error("Data potongan belum tersedia. Muat ulang sebelum menyimpan produk.");
      return;
    }
    if (!draft.name.trim() || !draft.brand.trim()) {
      toast.error("Brand dan nama produk wajib diisi.");
      return;
    }
    if (!preview) {
      toast.error("Kombinasi potongan tidak dapat dihitung. Periksa total persentase.");
      return;
    }

    try {
      const now = new Date().toISOString();
      if (product) {
        await updateProductMutation.mutateAsync({ id: product.id, input: { ...draft } });
        toast.success("Produk diperbarui.");
      } else {
        await createProductMutation.mutateAsync({
          id: createId("product"),
          ...draft,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Produk ditambahkan.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Produk gagal disimpan.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }}
      title={product ? "Edit produk" : "Tambah produk"}
      description="Harga jual dan uang diterima dihitung langsung dari modal, target laba, serta potongan aktif."
      className="sm:max-w-3xl"
    >
      <form onSubmit={submit}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Brand / ScentCo">
            <Input
              value={draft.brand}
              onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}
              placeholder="Contoh: Mykonos"
            />
          </Field>
          <Field label="Ukuran">
            <Input
              value={draft.size}
              onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
              placeholder="Contoh: 50ML"
            />
          </Field>
          <Field label="Nama produk" className="sm:col-span-2">
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nama varian parfum"
            />
          </Field>
          <Field label="SKU" hint="Opsional, tetapi disarankan untuk impor penjualan.">
            <Input
              value={draft.sku}
              onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}
              placeholder="SKU internal"
            />
          </Field>
          <Field label="Stok saat ini">
            <Input type="number" min="0" value={draft.stock} onChange={(event) => updateNumber("stock", event.target.value)} />
          </Field>
          <Field label="Harga asli / modal">
            <Input type="number" min="0" value={draft.capitalCost} onChange={(event) => updateNumber("capitalCost", event.target.value)} />
          </Field>
          <Field label="Target keuntungan">
            <Input type="number" min="0" value={draft.targetProfit} onChange={(event) => updateNumber("targetProfit", event.target.value)} />
          </Field>
          <Field label="Peringatan stok rendah" className="sm:col-span-2">
            <Input
              type="number"
              min="0"
              value={draft.lowStockThreshold}
              onChange={(event) => updateNumber("lowStockThreshold", event.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">Potongan produk</p>
              <FetchingIndicator active={fees !== undefined && feesQuery.isFetching} label="Memperbarui potongan..." />
            </div>
            {fees === undefined && feesQuery.isPending ? <QueryLoadingState compact title="Memuat potongan produk..." /> : null}
            {feesQuery.isError ? <QueryErrorState compact title="Potongan belum berhasil dimuat. Perhitungan dan penyimpanan dinonaktifkan." error={feesQuery.error} onRetry={feesQuery.refetch} /> : null}
            {fees && fees.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {fees.map((fee: FeeRule) => {
                  const checked = draft.feeOverrides[fee.id] ?? fee.defaultForProducts;
                  return (
                    <Switch
                      key={fee.id}
                      checked={checked && fee.active}
                      disabled={!fee.active}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          feeOverrides: { ...current.feeOverrides, [fee.id]: value },
                        }))
                      }
                      label={fee.name}
                      description={
                        fee.kind === "percentage"
                          ? formatPercent(fee.value)
                          : `${formatCurrency(fee.value)} / ${fee.appliesPer === "order" ? "pesanan" : "item"}`
                      }
                    />
                  );
                })}
              </div>
            ) : null}
            {feesQuery.isSuccess && fees?.length === 0 ? <QueryEmptyState compact title="Tidak ada potongan aktif." description="Harga dihitung tanpa potongan marketplace." /> : null}
          </div>

          {feesReady && preview ? (
            <div className="sm:col-span-2 grid gap-3 rounded-2xl bg-[var(--forest)] p-5 text-white sm:grid-cols-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/50">Harga jual Shopee</p>
                <p className="mt-2 text-xl font-bold">{formatCurrency(preview.sellingPrice)}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/50">Uang diterima</p>
                <p className="mt-2 text-xl font-bold">{formatCurrency(preview.receivedAmount)}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/50">Total potongan</p>
                <p className="mt-2 text-xl font-bold text-[#f2c982]">{formatCurrency(preview.totalFees)}</p>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2 rounded-2xl bg-[var(--forest)] p-5 text-sm leading-6 text-white/70">
              {feesReady ? "Harga belum dapat dihitung. Periksa kombinasi potongan." : "Perhitungan harga menunggu data potongan yang berhasil dimuat."}
            </div>
          )}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4 sm:px-7">
          <Button variant="ghost" disabled={saving} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={saving || !feesReady} aria-busy={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : feesQuery.isError ? "Potongan tidak tersedia" : !feesReady ? "Memuat potongan..." : "Simpan produk"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
