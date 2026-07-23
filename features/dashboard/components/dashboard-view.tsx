"use client";

import {
  Boxes,
  CircleDollarSign,
  PackageSearch,
  Receipt,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import {
  FetchingIndicator,
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
} from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveFees } from "@/features/fees/api/fee.query";
import { calculateProductPrice } from "@/features/pricing/utils/pricing.utils";
import { useSettings } from "@/features/settings/api/settings.query";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

import { BrandPortfolioChart } from "./brand-portfolio-chart";
import { FeeDonutChart } from "./fee-donut-chart";
import { useDashboardSummary } from "../api/dashboard.query";

export default function DashboardPage() {
  const dashboardQuery = useDashboardSummary();
  const feesQuery = useActiveFees();
  const settingsQuery = useSettings();
  const dashboardData = dashboardQuery.data;
  const fees = feesQuery.data;
  const settings = settingsQuery.data;

  const productInsights = useMemo(
    () =>
      dashboardData?.topProducts.map((product) => {
        try {
          return { product, pricing: fees ? calculateProductPrice(product, fees) : null };
        } catch {
          return { product, pricing: null };
        }
      }) ?? [],
    [dashboardData?.topProducts, fees],
  );

  const feeChart = useMemo(
    () =>
      fees
        ? fees
            .filter(
              (fee) =>
                fee.active &&
                !fee.archivedAt &&
                fee.kind === "percentage" &&
                fee.defaultForProducts,
            )
            .map((fee) => ({ name: fee.name, value: fee.value }))
        : [],
    [fees],
  );

  const topProducts = useMemo(() => productInsights.filter((item) => item.pricing), [productInsights]);

  const header = (
    <PageHeader
      eyebrow="Business cockpit"
      title={`Arahkan setiap rupiah, ${settings?.storeName ?? "toko Anda"}.`}
      description="Harga jual, potongan marketplace, modal, dan keuntungan Anda berada dalam satu pandangan yang bisa ditindaklanjuti."
      actions={
        <>
          <Button variant="secondary" asChild><Link href="/settings">Atur potongan</Link></Button>
          <Button asChild><Link href="/products">Kelola produk</Link></Button>
        </>
      }
    />
  );

  const hardFailure = dashboardQuery.isLoadingError
    ? {
        title: "Ringkasan dashboard belum berhasil dimuat.",
        error: dashboardQuery.error,
        retry: dashboardQuery.refetch,
      }
    : feesQuery.isLoadingError
      ? {
          title: "Referensi potongan belum berhasil dimuat.",
          error: feesQuery.error,
          retry: feesQuery.refetch,
        }
      : settingsQuery.isLoadingError
        ? {
            title: "Profil toko belum berhasil dimuat.",
            error: settingsQuery.error,
            retry: settingsQuery.refetch,
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
    dashboardQuery.isPending || feesQuery.isPending || settingsQuery.isPending;

  if (initialPending || dashboardData === undefined || fees === undefined || settings === undefined) {
    return (
      <>
        {header}
        <QueryLoadingState
          title="Menyiapkan ringkasan bisnis..."
          description="Mengambil ringkasan dashboard, potongan aktif, dan profil toko."
        />
      </>
    );
  }

  const summary = dashboardData;
  const lowStockProducts = summary.lowStockProducts;
  const isFetching =
    dashboardQuery.isFetching || feesQuery.isFetching || settingsQuery.isFetching;
  const hasRefetchError =
    dashboardQuery.isRefetchError || feesQuery.isRefetchError || settingsQuery.isRefetchError;

  return (
    <>
      {header}

      {isFetching ? (
        <div className="mb-4 flex justify-end">
          <FetchingIndicator active label="Memperbarui dashboard..." />
        </div>
      ) : null}

      {hasRefetchError ? (
        <div className="mb-4 space-y-2">
          {dashboardQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Ringkasan gagal diperbarui; data terakhir tetap ditampilkan."
              error={dashboardQuery.error}
              onRetry={dashboardQuery.refetch}
            />
          ) : null}
          {feesQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Potongan gagal diperbarui; perhitungan terakhir tetap ditampilkan."
              error={feesQuery.error}
              onRetry={feesQuery.refetch}
            />
          ) : null}
          {settingsQuery.isRefetchError ? (
            <QueryErrorState
              compact
              title="Profil toko gagal diperbarui; data terakhir tetap ditampilkan."
              error={settingsQuery.error}
              onRetry={settingsQuery.refetch}
            />
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={summary.salesCount ? "Pendapatan diterima" : "Modal katalog"}
          value={formatCompactCurrency(summary.salesCount ? summary.salesRevenue : summary.catalogCapital)}
          detail={
            summary.salesCount
              ? `${summary.salesCount} baris penjualan tercatat`
              : `Modal satu unit dari ${summary.productCount} SKU`
          }
          icon={WalletCards}
          accent="forest"
        />
        <MetricCard
          label={summary.salesCount ? "Laba terealisasi" : "Target laba katalog"}
          value={formatCompactCurrency(summary.salesCount ? summary.realizedProfit : summary.catalogTargetProfit)}
          detail={
            summary.salesCount
              ? `${summary.salesRevenue ? ((summary.realizedProfit / summary.salesRevenue) * 100).toFixed(1) : 0}% dari pendapatan bersih`
              : `${formatCurrency(summary.catalogCapital + summary.catalogTargetProfit)} target uang diterima`
          }
          icon={TrendingUp}
          accent="clay"
        />
        <MetricCard
          label={summary.salesCount ? "Potongan marketplace" : "Nilai stok modal"}
          value={formatCompactCurrency(summary.salesCount ? summary.totalFees : summary.inventoryCapital)}
          detail={
            summary.salesCount
              ? "Snapshot sesuai transaksi, tidak berubah saat tarif diedit"
              : `${formatNumber(summary.totalStock)} unit dicatat manual`
          }
          icon={summary.salesCount ? Receipt : Boxes}
          accent="amber"
        />
        <MetricCard
          label="Perlu perhatian"
          value={`${summary.lowStockCount} produk`}
          detail="Stok berada di bawah atau sama dengan batas minimum"
          icon={PackageSearch}
          accent="sage"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.85fr)]">
        <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Peta portofolio</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Modal vs target laba per brand</h2>
            </div>
            <Badge tone="green">{summary.productCount} SKU</Badge>
          </div>
          <div className="mt-6">
            {summary.brandChart.length ? (
              <BrandPortfolioChart data={summary.brandChart} />
            ) : (
              <QueryEmptyState
                compact
                className="min-h-[310px]"
                icon={Boxes}
                title="Belum ada portofolio brand."
                description="Tambahkan produk untuk melihat perbandingan modal dan target laba."
              />
            )}
          </div>
        </article>

        <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
          <p className="eyebrow">Komposisi potongan</p>
          <h2 className="font-display mt-2 text-2xl font-semibold">Tarif default produk</h2>
          {feeChart.length ? (
            <>
              <div className="mx-auto mt-4 max-w-[280px]"><FeeDonutChart data={feeChart} /></div>
              <div className="mt-2 space-y-2">
                {feeChart.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[var(--ink-soft)]">
                      <span className="h-2 w-2 rounded-full" style={{ background: ["#153f36", "#f16d4b", "#efb64b", "#78a797", "#7181d8"][index % 5] }} />
                      {item.name}
                    </span>
                    <strong>{formatPercent(item.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <QueryEmptyState
              compact
              className="min-h-[245px]"
              icon={Receipt}
              title="Belum ada tarif default aktif."
              description="Aktifkan potongan default produk dari halaman pengaturan."
            />
          )}
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Margin tertinggi</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Produk paling agresif</h2>
            </div>
            <CircleDollarSign className="h-6 w-6 text-[var(--clay)]" />
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {topProducts.length ? (
              topProducts.map(({ product, pricing }, index) => (
                <Link
                  key={product.id}
                  href="/products"
                  className="flex items-center gap-4 py-3.5 transition hover:translate-x-1"
                >
                  <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--mint)] text-sm font-bold text-[var(--forest)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{product.name}</span>
                    <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                      {product.brand} · {product.size}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-bold text-[var(--forest)]">
                      {formatCurrency(product.targetProfit)}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                      jual {formatCompactCurrency(pricing?.sellingPrice ?? 0)}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <QueryEmptyState
                compact
                icon={CircleDollarSign}
                title="Belum ada rekomendasi harga."
                description="Tambahkan produk dan pastikan total potongan valid untuk menghitung harga jual."
              />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-[1.6rem] bg-[linear-gradient(145deg,var(--nav)_0%,#19483d_100%)] text-white shadow-[0_22px_60px_rgba(13,35,29,0.18)] ring-1 ring-white/10">
          <div className="subtle-grid h-full p-6 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mint)] text-[var(--forest)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              Formula aktif
            </p>
            <h2 className="font-display mt-3 max-w-lg text-3xl font-bold leading-[1.05] tracking-[-0.05em]">
              Harga jual dibalik dari uang yang benar-benar ingin Anda terima.
            </h2>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 font-mono text-xs leading-6 text-white/[0.72]">
              (modal + target laba + biaya tetap)<br />÷ (1 − total persentase)
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="bg-[var(--mint)] text-[var(--forest)] hover:bg-white"><Link href="/products">Buka kalkulator</Link></Button>
              <Button asChild className="border border-white/20 bg-transparent text-white hover:bg-white/10"><Link href="/decant">Masuk Decant Lab</Link></Button>
            </div>
          </div>
        </article>
      </section>

      {lowStockProducts.length ? (
        <section className="paper-card mt-4 rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Kontrol persediaan</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Stok perlu diperbarui</h2>
            </div>
            <Button asChild variant="secondary" size="sm"><Link href="/products">Lihat semua produk</Link></Button>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="rounded-2xl border border-[var(--line)] bg-white/65 p-4 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-white">
                <Badge tone={product.stock === 0 ? "red" : "orange"}>
                  {product.stock === 0 ? "Kosong" : `${product.stock} unit`}
                </Badge>
                <p className="mt-3 truncate text-sm font-bold">{product.name}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{product.brand} · {product.size}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
