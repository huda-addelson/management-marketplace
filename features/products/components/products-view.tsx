"use client";

import {
  Coins,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductFormModal } from "./product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  FetchingIndicator,
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
  TableLoadingRows,
} from "@/components/common/query-state";
import { useActiveFees } from "@/features/fees/api/fee.query";
import { calculateProductPrice } from "@/features/pricing/utils/pricing.utils";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/utils";
import type { Product } from "@/types/domain";

import { useDeleteProduct } from "../api/product.mutation";
import { useProductBrands, useProductPage, useProductSummary } from "../api/product.query";

export default function ProductsPage() {
  const deleteProductMutation = useDeleteProduct();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const deferredSearch = useDeferredValue(search);

  const productPageQuery = useProductPage({ page, pageSize, search: deferredSearch, brand });
  const summaryQuery = useProductSummary();
  const brandsQuery = useProductBrands();
  const feesQuery = useActiveFees();
  const productPage = productPageQuery.data;
  const summary = summaryQuery.data;
  const brands = brandsQuery.data;
  const fees = feesQuery.data;
  const products = useMemo(() => productPage?.items ?? [], [productPage?.items]);
  const pricingAvailable = fees !== undefined && !feesQuery.isError;
  const pageIsEmpty =
    (productPageQuery.isSuccess || productPageQuery.isRefetchError) &&
    !productPageQuery.isPlaceholderData &&
    products.length === 0;
  const showTableLoading =
    productPageQuery.isPending ||
    (productPageQuery.isPlaceholderData && products.length === 0);
  const refreshing = [productPageQuery, summaryQuery, brandsQuery, feesQuery].some(
    (query) => query.isFetching && query.data !== undefined,
  );

  const calculations = new Map(
    products.map((product) => {
      if (!fees || feesQuery.isError) return [product.id, null] as const;
      try {
        return [product.id, calculateProductPrice(product, fees)] as const;
      } catch {
        return [product.id, null] as const;
      }
    }),
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const remove = async (product: Product) => {
    if (deletingIds.has(product.id)) return;
    if (!window.confirm(`Hapus produk “${product.name}”? Riwayat penjualan tetap tersimpan.`)) return;
    setDeletingIds((current) => new Set(current).add(product.id));
    try {
      await deleteProductMutation.mutateAsync(product.id);
      if (products.length === 1 && page > 1) setPage((current) => current - 1);
      toast.success("Produk dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Produk gagal dihapus.");
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(product.id);
        return next;
      });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Product pricing"
        title="Produk, modal, dan harga yang masuk akal."
        description="Setiap harga jual dihitung mundur dari uang yang ingin diterima, bukan sekadar menambahkan persentase ke modal."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah produk</Button>}
      />

      {productPageQuery.isRefetchError || summaryQuery.isRefetchError || brandsQuery.isRefetchError || feesQuery.isRefetchError ? (
        <div className="mb-4 space-y-2">
          {productPageQuery.isRefetchError ? <QueryErrorState compact title="Daftar produk gagal diperbarui." error={productPageQuery.error} onRetry={productPageQuery.refetch} /> : null}
          {summaryQuery.isRefetchError ? <QueryErrorState compact title="Ringkasan produk gagal diperbarui." error={summaryQuery.error} onRetry={summaryQuery.refetch} /> : null}
          {brandsQuery.isRefetchError ? <QueryErrorState compact title="Daftar brand gagal diperbarui." error={brandsQuery.error} onRetry={brandsQuery.refetch} /> : null}
          {feesQuery.isRefetchError ? <QueryErrorState compact title="Potongan gagal diperbarui. Perhitungan harga dinonaktifkan." error={feesQuery.error} onRetry={feesQuery.refetch} /> : null}
        </div>
      ) : null}

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Modal 1 unit / SKU" value={formatCompactCurrency(summary.totalCapital)} detail={`${summary.total} produk dalam katalog`} icon={Coins} accent="forest" />
          <MetricCard label="Target laba katalog" value={formatCompactCurrency(summary.totalTarget)} detail="Akumulasi target satu unit per SKU" icon={TrendingUp} accent="clay" />
          <MetricCard label="Stok tercatat" value={`${formatNumber(summary.totalStock)} unit`} detail={`${formatCompactCurrency(summary.inventoryCapital)} nilai modal persediaan`} icon={Coins} accent="amber" />
        </section>
      ) : summaryQuery.isError ? (
        <QueryErrorState title="Ringkasan produk belum berhasil dimuat." error={summaryQuery.error} onRetry={summaryQuery.refetch} />
      ) : (
        <QueryLoadingState compact title="Memuat ringkasan produk..." />
      )}

      {brands === undefined && brandsQuery.isPending ? <QueryLoadingState compact className="mt-4" title="Memuat daftar brand..." /> : null}
      {brands === undefined && brandsQuery.isError ? <QueryErrorState compact className="mt-4" title="Daftar brand belum berhasil dimuat." error={brandsQuery.error} onRetry={brandsQuery.refetch} /> : null}
      {fees === undefined && feesQuery.isPending ? <QueryLoadingState compact className="mt-4" title="Memuat potongan untuk perhitungan harga..." /> : null}
      {fees === undefined && feesQuery.isError ? <QueryErrorState compact className="mt-4" title="Potongan belum berhasil dimuat. Perhitungan harga dinonaktifkan." error={feesQuery.error} onRetry={feesQuery.refetch} /> : null}

      <section className="paper-card mt-4 overflow-hidden rounded-[1.6rem]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari produk, brand, ukuran, atau SKU..." className="pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FetchingIndicator active={refreshing} />
            <Select value={brand} disabled={brands === undefined || brandsQuery.isError} onChange={(event) => { setBrand(event.target.value); setPage(1); }} className="sm:w-48">
              <option value="all">{brands === undefined ? "Memuat brand..." : "Semua brand"}</option>
              {brands?.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
        </div>

        {productPage === undefined && productPageQuery.isError ? (
          <QueryErrorState className="m-5" title="Daftar produk belum berhasil dimuat." error={productPageQuery.error} onRetry={productPageQuery.refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--paper-muted)] text-[0.63rem] font-extrabold uppercase tracking-[0.11em] text-[var(--ink-soft)]">
                    <th className="px-5 py-3.5">Produk</th>
                    <th className="px-4 py-3.5">Modal</th>
                    <th className="px-4 py-3.5">Target laba</th>
                    <th className="px-4 py-3.5">Harga Shopee</th>
                    <th className="px-4 py-3.5">Diterima</th>
                    <th className="px-4 py-3.5">Stok</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {showTableLoading ? <TableLoadingRows columns={7} /> : products.map((product) => {
                    const pricing = calculations.get(product.id);
                    const deleting = deletingIds.has(product.id);
                    return (
                      <tr key={product.id} aria-busy={deleting} className="group transition-colors hover:bg-brand-soft/[0.22]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-display flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-[var(--mint)] text-sm font-bold text-[var(--forest)] ring-1 ring-brand/[0.08]">
                          {product.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <span className="block max-w-[250px] truncate text-sm font-bold">{product.name}</span>
                          <span className="mt-1 block text-xs text-[var(--ink-soft)]">{product.brand} · {product.size}{product.sku ? ` · ${product.sku}` : ""}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">{formatCurrency(product.capitalCost)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[var(--clay-dark)]">{formatCurrency(product.targetProfit)}</td>
                    <td className="px-4 py-4 text-sm font-bold">{pricing ? formatCurrency(pricing.sellingPrice) : <Badge tone={pricingAvailable ? "red" : "orange"}>{pricingAvailable ? "Cek fee" : feesQuery.isError ? "Fee gagal" : "Memuat fee"}</Badge>}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--forest)]">{pricing ? formatCurrency(pricing.receivedAmount) : "-"}</td>
                    <td className="px-4 py-4">
                      <Badge tone={product.stock === 0 ? "red" : product.stock <= product.lowStockThreshold ? "orange" : "green"}>
                        {formatNumber(product.stock)} unit
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" disabled={deleting} onClick={() => openEdit(product)} aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" disabled={deleting} className="hover:text-[var(--danger)]" onClick={() => void remove(product)} aria-label={deleting ? `Menghapus ${product.name}` : `Hapus ${product.name}`}>{deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
                      </div>
                    </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pageIsEmpty ? (
              <QueryEmptyState compact title="Tidak ada produk yang cocok." description="Ubah filter atau tambahkan produk baru." />
            ) : productPage && products.length ? (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={productPage.total}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            ) : null}
          </>
        )}
      </section>

      <ProductFormModal
        key={modalOpen ? editing?.id ?? "new-product" : "closed-product"}
        open={modalOpen}
        product={editing}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
