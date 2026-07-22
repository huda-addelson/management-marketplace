"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useActiveFees } from "@/features/fees/api/fee.query";
import {
  calculateProductPrice,
  calculateSale,
  resolveFees,
} from "@/features/pricing/utils/pricing.utils";
import { useProductOptions } from "@/features/products/api/product.query";
import { createId, formatCurrency } from "@/lib/utils";
import type { Sale } from "@/types/domain";

import { useCreateSale } from "../api/sale.mutation";

export function SaleFormModal({
  open,
  initialOrderNumber,
  initialSoldAt,
  onClose,
}: {
  open: boolean;
  initialOrderNumber: string;
  initialSoldAt: string;
  onClose: () => void;
}) {
  const createSaleMutation = useCreateSale();
  const feesQuery = useActiveFees();
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [soldAt, setSoldAt] = useState(initialSoldAt);
  const [quantity, setQuantity] = useState(1);
  const [unitSellingPrice, setUnitSellingPrice] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [adjustStock, setAdjustStock] = useState(true);
  const deferredProductSearch = useDeferredValue(productSearch);
  const productsQuery = useProductOptions(deferredProductSearch);
  const saving = createSaleMutation.isPending;
  const fees = feesQuery.data;
  const products = productsQuery.data;
  const referencesReady =
    fees !== undefined &&
    products !== undefined &&
    !feesQuery.isError &&
    !productsQuery.isError;
  const referencesFetching =
    (fees !== undefined && feesQuery.isFetching) ||
    (products !== undefined && productsQuery.isFetching);

  const product = products?.find((item) => item.id === productId) ?? null;
  const selectedFees = useMemo(() => {
    if (!fees || !product || feesQuery.isError || productsQuery.isError) return null;
    return resolveFees(fees, product.feeOverrides, "products");
  }, [fees, feesQuery.isError, product, productsQuery.isError]);
  const calculation = useMemo(() => {
    if (!selectedFees || !product || unitSellingPrice <= 0) return null;
    return calculateSale({
      unitSellingPrice,
      quantity,
      unitCapitalCost: product.capitalCost,
      extraCost,
      fees: selectedFees,
    });
  }, [extraCost, product, quantity, selectedFees, unitSellingPrice]);

  const selectProduct = (id: string) => {
    setProductId(id);
    const selected = products?.find((item) => item.id === id);
    if (selected && fees && !feesQuery.isError && !productsQuery.isError) {
      try {
        setUnitSellingPrice(calculateProductPrice(selected, fees).sellingPrice);
      } catch {
        setUnitSellingPrice(0);
      }
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!fees || feesQuery.isError) {
      toast.error("Data potongan belum tersedia. Muat ulang sebelum menyimpan penjualan.");
      return;
    }
    if (!products || productsQuery.isError) {
      toast.error("Pilihan produk belum tersedia. Muat ulang sebelum menyimpan penjualan.");
      return;
    }
    if (!product || !calculation || unitSellingPrice <= 0 || quantity <= 0) {
      toast.error("Pilih produk dan isi harga jual yang valid.");
      return;
    }
    try {
      const now = new Date().toISOString();
      const sale: Sale = {
        id: createId("sale"),
        orderNumber: orderNumber.trim() || `MAN-${Date.now()}`,
        soldAt,
        source: "manual",
        calculationMode: "estimated",
        stockAdjusted: adjustStock,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitSellingPrice,
        grossRevenue: calculation.grossRevenue,
        receivedAmount: calculation.receivedAmount,
        unitCapitalCost: product.capitalCost,
        totalCapitalCost: calculation.totalCapitalCost,
        extraCost,
        totalFees: calculation.totalFees,
        profit: calculation.profit,
        feeSnapshot: calculation.fees,
        notes,
        createdAt: now,
        updatedAt: now,
      };
      await createSaleMutation.mutateAsync({ sale, adjustStock });
      toast.success("Penjualan dicatat.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Penjualan gagal disimpan.");
    }
  };

  return (
    <Modal open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }} title="Catat penjualan" description="Potongan disimpan sebagai snapshot agar laporan tidak berubah saat tarif diperbarui." className="sm:max-w-3xl">
      <form onSubmit={submit}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div className="sm:col-span-2 flex justify-end">
            <FetchingIndicator active={referencesFetching} label="Memperbarui data referensi..." />
          </div>
          {fees === undefined && feesQuery.isPending ? <QueryLoadingState compact className="sm:col-span-2" title="Memuat potongan penjualan..." /> : null}
          {feesQuery.isError ? <QueryErrorState compact className="sm:col-span-2" title="Potongan belum berhasil dimuat. Perhitungan dan penyimpanan dinonaktifkan." error={feesQuery.error} onRetry={feesQuery.refetch} /> : null}
          <Field label="Produk" className="sm:col-span-2">
            <div className="space-y-2">
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Cari nama, brand, ukuran, atau SKU..."
              />
              <Select value={productId} disabled={!referencesReady} onChange={(event) => selectProduct(event.target.value)}>
                <option value="">{productsQuery.isError ? "Pilihan produk tidak tersedia" : products === undefined ? "Mencari produk..." : "Pilih dari maksimal 20 hasil"}</option>
                {products?.map((item) => <option key={item.id} value={item.id}>{item.brand} · {item.name} · {item.size}</option>)}
              </Select>
              {products === undefined && productsQuery.isPending ? <QueryLoadingState compact title="Mencari pilihan produk..." /> : null}
              {productsQuery.isError ? <QueryErrorState compact title="Pilihan produk belum berhasil dimuat. Perhitungan dan penyimpanan dinonaktifkan." error={productsQuery.error} onRetry={productsQuery.refetch} /> : null}
              {productsQuery.isSuccess && products?.length === 0 ? <QueryEmptyState compact title="Produk tidak ditemukan." description="Ubah pencarian atau tambahkan produk terlebih dahulu." /> : null}
            </div>
          </Field>
          <Field label="Nomor pesanan">
            <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
          </Field>
          <Field label="Tanggal terjual">
            <Input type="date" value={soldAt} onChange={(event) => setSoldAt(event.target.value)} />
          </Field>
          <Field label="Kuantitas">
            <Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} />
          </Field>
          <Field label="Harga jual per unit">
            <Input type="number" min="0" value={unitSellingPrice} onChange={(event) => setUnitSellingPrice(Math.max(0, Number(event.target.value) || 0))} />
          </Field>
          <Field label="Biaya tambahan order" hint="Contoh kemasan khusus atau biaya operasional." className="sm:col-span-2">
            <Input type="number" min="0" value={extraCost} onChange={(event) => setExtraCost(Math.max(0, Number(event.target.value) || 0))} />
          </Field>
          <Field label="Catatan" className="sm:col-span-2">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" />
          </Field>
          <div className="sm:col-span-2">
            <Switch checked={adjustStock} onChange={setAdjustStock} label="Kurangi stok setelah disimpan" description={product ? `Stok saat ini ${product.stock} unit.` : "Pilih produk untuk melihat stok."} />
          </div>

          {calculation ? (
            <div className="sm:col-span-2 grid gap-3 rounded-2xl bg-[var(--forest)] p-5 text-white sm:grid-cols-4">
              <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.11em] text-white/45">Kotor</p><p className="mt-2 font-bold">{formatCurrency(calculation.grossRevenue)}</p></div>
              <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.11em] text-white/45">Potongan</p><p className="mt-2 font-bold">{formatCurrency(calculation.totalFees)}</p></div>
              <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.11em] text-white/45">Diterima</p><p className="mt-2 font-bold">{formatCurrency(calculation.receivedAmount)}</p></div>
              <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.11em] text-white/45">Profit</p><p className="mt-2 font-bold text-[#f2c982]">{formatCurrency(calculation.profit)}</p></div>
            </div>
          ) : (
            <div className="sm:col-span-2 rounded-2xl bg-[var(--forest)] p-5 text-sm leading-6 text-white/70">
              {!referencesReady
                ? "Perhitungan menunggu data potongan dan pilihan produk yang berhasil dimuat."
                : !product
                  ? "Pilih produk untuk melihat ringkasan transaksi."
                  : "Isi harga jual yang valid untuk melihat ringkasan transaksi."}
            </div>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4 sm:px-7">
          <Button variant="ghost" disabled={saving} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={saving || !referencesReady} aria-busy={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : feesQuery.isError || productsQuery.isError ? "Referensi tidak tersedia" : !referencesReady ? "Memuat referensi..." : "Simpan penjualan"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
