"use client";

import {
  Banknote,
  CircleDollarSign,
  LoaderCircle,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";

import { SaleFormModal } from "./sale-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { Sale } from "@/types/domain";

import { useDeleteSale } from "../api/sale.mutation";
import { useSalePage, useSaleSummary } from "../api/sale.query";

interface SaleDefaults {
  orderNumber: string;
  soldAt: string;
}

export default function SalesPage() {
  const deleteSaleMutation = useDeleteSale();
  const [modalOpen, setModalOpen] = useState(false);
  const [saleDefaults, setSaleDefaults] = useState<SaleDefaults | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const deferredSearch = useDeferredValue(search);

  const salePageQuery = useSalePage({ page, pageSize, search: deferredSearch });
  const summaryQuery = useSaleSummary();
  const salePage = salePageQuery.data;
  const summary = summaryQuery.data;
  const sales = salePage?.items ?? [];
  const pageIsEmpty =
    (salePageQuery.isSuccess || salePageQuery.isRefetchError) &&
    !salePageQuery.isPlaceholderData &&
    sales.length === 0;
  const showTableLoading =
    salePageQuery.isPending ||
    (salePageQuery.isPlaceholderData && sales.length === 0);
  const refreshing = [salePageQuery, summaryQuery].some(
    (query) => query.isFetching && query.data !== undefined,
  );

  const remove = async (sale: Sale) => {
    if (deletingIds.has(sale.id)) return;
    const message = sale.stockAdjusted
      ? `Hapus transaksi ${sale.orderNumber} dan kembalikan ${sale.stockDelta ?? sale.quantity} stok?`
      : `Hapus transaksi ${sale.orderNumber}?`;
    if (!window.confirm(message)) return;
    setDeletingIds((current) => new Set(current).add(sale.id));
    try {
      await deleteSaleMutation.mutateAsync(sale.id);
      if (sales.length === 1 && page > 1) setPage((current) => current - 1);
      toast.success("Penjualan dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Penjualan gagal dihapus.");
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(sale.id);
        return next;
      });
    }
  };

  const openSaleModal = () => {
    const now = new Date();
    setSaleDefaults({
      orderNumber: `MAN-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${String(now.getTime()).slice(-5)}`,
      soldAt: now.toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales ledger"
        title="Dari harga jual menjadi laba yang nyata."
        description="Catat transaksi manual atau impor laporan. Setiap baris menyimpan modal dan potongan saat transaksi terjadi."
        actions={<Button onClick={openSaleModal}><Plus className="h-4 w-4" /> Catat penjualan</Button>}
      />

      {salePageQuery.isRefetchError || summaryQuery.isRefetchError ? (
        <div className="mb-4 space-y-2">
          {salePageQuery.isRefetchError ? <QueryErrorState compact title="Daftar penjualan gagal diperbarui." error={salePageQuery.error} onRetry={salePageQuery.refetch} /> : null}
          {summaryQuery.isRefetchError ? <QueryErrorState compact title="Ringkasan penjualan gagal diperbarui." error={summaryQuery.error} onRetry={summaryQuery.refetch} /> : null}
        </div>
      ) : null}

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Penjualan kotor" value={formatCompactCurrency(summary.grossRevenue)} detail={`${formatNumber(summary.total)} baris transaksi`} icon={Banknote} accent="forest" />
          <MetricCard label="Uang diterima" value={formatCompactCurrency(summary.receivedAmount)} detail="Setelah seluruh potongan" icon={CircleDollarSign} accent="clay" />
          <MetricCard label="Total potongan" value={formatCompactCurrency(summary.totalFees)} detail={summary.grossRevenue ? `${((summary.totalFees / summary.grossRevenue) * 100).toFixed(1)}% dari penjualan kotor` : "Belum ada transaksi"} icon={ReceiptText} accent="amber" />
          <MetricCard label="Laba bersih" value={formatCompactCurrency(summary.profit)} detail={summary.receivedAmount ? `${((summary.profit / summary.receivedAmount) * 100).toFixed(1)}% margin pendapatan` : "Setelah HPP dan biaya tambahan"} icon={TrendingUp} accent="sage" />
        </section>
      ) : summaryQuery.isError ? (
        <QueryErrorState title="Ringkasan penjualan belum berhasil dimuat." error={summaryQuery.error} onRetry={summaryQuery.refetch} />
      ) : (
        <QueryLoadingState compact title="Memuat ringkasan penjualan..." />
      )}

      <section className="paper-card mt-4 overflow-hidden rounded-[1.6rem]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nomor pesanan, produk, atau SKU..." className="pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FetchingIndicator active={refreshing} />
            <Button variant="secondary" asChild><Link href="/imports">Impor laporan</Link></Button>
          </div>
        </div>

        {salePage === undefined && salePageQuery.isError ? (
          <QueryErrorState className="m-5" title="Daftar penjualan belum berhasil dimuat." error={salePageQuery.error} onRetry={salePageQuery.refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-[var(--paper-muted)] text-[0.63rem] font-extrabold uppercase tracking-[0.11em] text-[var(--ink-soft)]">
                <tr><th className="px-5 py-3.5">Pesanan</th><th className="px-4 py-3.5">Produk</th><th className="px-4 py-3.5">Kotor</th><th className="px-4 py-3.5">Potongan</th><th className="px-4 py-3.5">Diterima</th><th className="px-4 py-3.5">Profit</th><th className="px-5 py-3.5 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {showTableLoading ? <TableLoadingRows columns={7} /> : sales.map((sale) => {
                  const deleting = deletingIds.has(sale.id);
                  return (
                  <tr key={sale.id} aria-busy={deleting} className="transition-colors hover:bg-brand-soft/[0.22]">
                    <td className="px-5 py-4"><p className="text-sm font-bold">{sale.orderNumber}</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{formatDate(sale.soldAt)} · {sale.source === "manual" ? "Manual" : "Impor"}</p></td>
                    <td className="px-4 py-4"><p className="max-w-[240px] truncate text-sm font-bold">{sale.productName}</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{sale.quantity} × {formatCurrency(sale.unitSellingPrice)}{sale.sku ? ` · ${sale.sku}` : ""}</p></td>
                    <td className="px-4 py-4 text-sm font-medium">{formatCurrency(sale.grossRevenue)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--clay-dark)]">{formatCurrency(sale.totalFees)}</td>
                    <td className="px-4 py-4 text-sm font-bold">{formatCurrency(sale.receivedAmount)}</td>
                    <td className="px-4 py-4"><p className="text-sm font-bold text-[var(--forest)]">{formatCurrency(sale.profit)}</p><Badge tone={sale.calculationMode === "actual" ? "green" : "orange"} className="mt-1.5">{sale.calculationMode === "actual" ? "Aktual" : "Estimasi"}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" size="icon" disabled={deleting} className="hover:text-[var(--danger)]" onClick={() => void remove(sale)} aria-label={deleting ? `Menghapus ${sale.orderNumber}` : `Hapus ${sale.orderNumber}`}>{deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button></td>
                  </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            {pageIsEmpty ? (
              <QueryEmptyState
                compact
                title="Belum ada penjualan."
                description="Catat transaksi pertama atau impor laporan Seller Centre."
                icon={ReceiptText}
                action={<Button onClick={openSaleModal}><Plus className="h-4 w-4" /> Catat penjualan</Button>}
              />
            ) : salePage && sales.length ? (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={salePage.total}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            ) : null}
          </>
        )}
      </section>

      {saleDefaults ? (
        <SaleFormModal
          key={saleDefaults.orderNumber}
          open={modalOpen}
          initialOrderNumber={saleDefaults.orderNumber}
          initialSoldAt={saleDefaults.soldAt}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
