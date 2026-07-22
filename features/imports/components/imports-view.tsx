"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  PackagePlus,
  ReceiptText,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/page-header";
import {
  FetchingIndicator,
  QueryErrorState,
  QueryLoadingState,
} from "@/components/common/query-state";
import { useActiveFees } from "@/features/fees/api/fee.query";
import {
  useFindProductsForImport,
  useImportProducts,
} from "@/features/products/api/product.mutation";
import { useImportSales } from "@/features/sales/api/sale.mutation";
import {
  autoDetectSalesMapping,
  buildSalesFromRows,
  emptySalesMapping,
  findLikelyHeaderRow,
  parsePricingProducts,
  parseTabularFile,
  type ParsedSheet,
  type SalesColumnMapping,
} from "@/features/imports/utils/import.utils";
import { formatCurrency } from "@/lib/utils";
import type { Product, Sale } from "@/types/domain";

const mappingLabels: Array<[keyof SalesColumnMapping, string, boolean]> = [
  ["orderNumber", "Nomor pesanan", false],
  ["soldAt", "Tanggal penjualan", false],
  ["productName", "Nama produk", false],
  ["sku", "SKU", false],
  ["quantity", "Kuantitas", false],
  ["unitSellingPrice", "Harga jual per unit", true],
  ["unitCapitalCost", "Modal/HPP per unit", false],
  ["extraCost", "Biaya tambahan", false],
  ["receivedAmount", "Uang diterima aktual", false],
  ["notes", "Catatan", false],
];

export default function ImportsPage() {
  const findProductsMutation = useFindProductsForImport();
  const importProductsMutation = useImportProducts();
  const importSalesMutation = useImportSales();
  const feesQuery = useActiveFees();
  const fees = feesQuery.data;
  const [mode, setMode] = useState<"products" | "sales">("products");
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [productPreview, setProductPreview] = useState<Product[]>([]);
  const [headerIndex, setHeaderIndex] = useState(0);
  const [mapping, setMapping] = useState<SalesColumnMapping>(emptySalesMapping);
  const [salePreview, setSalePreview] = useState<Sale[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [adjustStock, setAdjustStock] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeSheet = sheets[sheetIndex];
  const headers = activeSheet?.rows[headerIndex] ?? [];
  const previewingSales = findProductsMutation.isPending;
  const importingProducts = importProductsMutation.isPending;
  const importingSales = importSalesMutation.isPending;
  const mutationPending = previewingSales || importingProducts || importingSales;
  const salesFeesReady = fees !== undefined;

  const resetPreview = () => {
    setProductPreview([]);
    setSalePreview([]);
    setErrors([]);
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    resetPreview();
    try {
      const parsed = await parseTabularFile(file);
      setFileName(file.name);
      setSheets(parsed);
      const preferredIndex = mode === "products"
        ? Math.max(0, parsed.findIndex((sheet) => /shopee/i.test(sheet.name)))
        : 0;
      setSheetIndex(preferredIndex);
      const selected = parsed[preferredIndex];
      if (mode === "products") {
        setProductPreview(parsePricingProducts(selected.rows));
      } else {
        const likelyHeader = findLikelyHeaderRow(selected.rows);
        setHeaderIndex(likelyHeader);
        setMapping(autoDetectSalesMapping(selected.rows[likelyHeader] ?? []));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File tidak dapat dibaca.");
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  const chooseSheet = (index: number) => {
    setSheetIndex(index);
    resetPreview();
    const selected = sheets[index];
    if (!selected) return;
    if (mode === "products") {
      try {
        setProductPreview(parsePricingProducts(selected.rows));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sheet produk tidak valid.");
      }
    } else {
      const likelyHeader = findLikelyHeaderRow(selected.rows);
      setHeaderIndex(likelyHeader);
      setMapping(autoDetectSalesMapping(selected.rows[likelyHeader] ?? []));
    }
  };

  const previewSales = async () => {
    if (mutationPending) return;
    if (!salesFeesReady) {
      toast.error(feesQuery.isError ? "Fee aktif gagal dimuat. Coba lagi sebelum membuat pratinjau." : "Fee aktif masih dimuat.");
      return;
    }
    if (!activeSheet || mapping.unitSellingPrice === null || (mapping.productName === null && mapping.sku === null)) {
      toast.error("Petakan harga jual dan minimal Nama Produk atau SKU.");
      return;
    }
    setSalePreview([]);
    setErrors([]);
    try {
      const rows = activeSheet.rows.slice(headerIndex + 1);
      const skus = mapping.sku === null
        ? []
        : rows.map((row) => String(row[mapping.sku!] ?? "").trim()).filter(Boolean);
      const names = mapping.productName === null
        ? []
        : rows.map((row) => String(row[mapping.productName!] ?? "").trim()).filter(Boolean);
      const products = await findProductsMutation.mutateAsync({
        skus: Array.from(new Set(skus)),
        names: Array.from(new Set(names)),
      });
      const result = buildSalesFromRows({
        rows: activeSheet.rows,
        headerIndex,
        mapping,
        products,
        fees,
      });
      setSalePreview(result.sales);
      setErrors(result.errors);
      if (!result.sales.length) toast.error("Tidak ada baris penjualan valid yang ditemukan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Produk referensi gagal dimuat.");
    }
  };

  const commitProducts = async () => {
    if (mutationPending || !productPreview.length) return;

    try {
      const count = await importProductsMutation.mutateAsync(productPreview);
      toast.success(`${count} produk baru diimpor. Duplikat dilewati.`);
      setProductPreview([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Produk gagal diimpor.");
    }
  };

  const commitSales = async () => {
    if (mutationPending || !salePreview.length) return;
    if (!salesFeesReady) {
      toast.error(feesQuery.isError ? "Fee aktif gagal dimuat. Coba lagi sebelum mengimpor." : "Fee aktif masih dimuat.");
      return;
    }

    try {
      const count = await importSalesMutation.mutateAsync({ sales: salePreview, adjustStock });
      toast.success(`${count} penjualan baru diimpor. Duplikat dilewati.`);
      setSalePreview([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Penjualan gagal diimpor.");
    }
  };

  const changeMode = (next: "products" | "sales") => {
    setMode(next);
    setSheets([]);
    setFileName("");
    resetPreview();
  };

  return (
    <>
      <PageHeader
        eyebrow="Data intake"
        title="Bawa spreadsheet Anda, tanpa membawa kekacauannya."
        description="Impor daftar harga yang sudah ada atau petakan kolom laporan penjualan CSV/XLSX sebelum data masuk ke dashboard."
      />

      <div className="mb-4 inline-flex rounded-[1rem] border border-[var(--line)] bg-white/80 p-1.5 shadow-sm backdrop-blur">
        <button onClick={() => changeMode("products")} className={`flex items-center gap-2 rounded-[0.75rem] px-4 py-2.5 text-sm font-bold transition-all ${mode === "products" ? "bg-[var(--nav)] text-white shadow-md" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}><PackagePlus className="h-4 w-4" /> Daftar harga produk</button>
        <button onClick={() => changeMode("sales")} className={`flex items-center gap-2 rounded-[0.75rem] px-4 py-2.5 text-sm font-bold transition-all ${mode === "sales" ? "bg-[var(--nav)] text-white shadow-md" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}><ReceiptText className="h-4 w-4" /> Laporan penjualan</button>
      </div>

      {mode === "sales" ? (
        <div className="mb-4 flex flex-col items-start gap-2">
          {fees === undefined && feesQuery.isError ? (
            <QueryErrorState
              compact
              title="Fee aktif gagal dimuat."
              error={feesQuery.error}
              onRetry={() => feesQuery.refetch()}
            />
          ) : fees === undefined ? (
            <QueryLoadingState compact title="Memuat fee aktif untuk pratinjau penjualan..." />
          ) : feesQuery.isError ? (
            <QueryErrorState
              compact
              title="Fee terbaru gagal dimuat."
              description="Fee yang terakhir berhasil dimuat tetap tersedia untuk pratinjau dan impor."
              error={feesQuery.error}
              onRetry={() => feesQuery.refetch()}
            />
          ) : null}
          <FetchingIndicator active={fees !== undefined && feesQuery.isFetching} label="Memperbarui fee aktif..." />
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.3fr)]">
        <article className="paper-card h-fit rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--mint)] text-[var(--forest)] ring-1 ring-brand/[0.08]">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-5 text-2xl font-semibold">Pilih file sumber</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Mendukung `.csv` dan `.xlsx`. File hanya diproses di browser sebelum Anda menekan tombol impor.</p>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[1.15rem] border-2 border-dashed border-[var(--line-strong)] bg-[var(--paper-muted)] px-5 py-9 text-center transition-all hover:border-brand/45 hover:bg-brand-soft/[0.24]">
            <FileUp className="h-6 w-6 text-[var(--clay)]" />
            <span className="mt-3 text-sm font-bold">{loading ? "Membaca file..." : fileName || "Klik untuk memilih file"}</span>
            <span className="mt-1 text-xs text-[var(--ink-soft)]">Maksimalkan privasi dengan menyensor data pembeli.</span>
            <input type="file" accept=".csv,.xlsx" className="sr-only" disabled={loading} onChange={(event) => void loadFile(event.target.files?.[0])} />
          </label>

          {sheets.length > 1 ? (
            <Field label="Sheet yang digunakan" className="mt-5">
              <Select value={sheetIndex} onChange={(event) => chooseSheet(Number(event.target.value))}>
                {sheets.map((sheet, index) => <option key={`${sheet.name}-${index}`} value={index}>{sheet.name}</option>)}
              </Select>
            </Field>
          ) : null}

          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white/55 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-[var(--forest)]" />
              <p className="text-xs leading-5 text-[var(--ink-soft)]">
                {mode === "products"
                  ? "Importer mencari kolom Nama Produk, Harga Asli, dan Target Keuntungan. Brand serta ukuran kosong meneruskan nilai baris sebelumnya seperti spreadsheet Anda."
                  : "Laporan Shopee dapat berubah format. Karena itu, setiap kolom dipetakan secara eksplisit sebelum impor."}
              </p>
            </div>
          </div>
        </article>

        <article className="paper-card rounded-[1.6rem] p-5 sm:p-6">
          <p className="eyebrow">Pratinjau impor</p>
          <h2 className="font-display mt-2 text-2xl font-semibold">
            {mode === "products" ? "Produk yang dikenali" : "Pemetaan laporan penjualan"}
          </h2>

          {!activeSheet ? (
            <div className="py-16 text-center">
              <FileSpreadsheet className="mx-auto h-9 w-9 text-[var(--sage)]" />
              <p className="mt-4 text-sm font-bold">Belum ada file dipilih.</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Pratinjau akan muncul di area ini.</p>
            </div>
          ) : mode === "products" ? (
            <>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#86d3a7]/25 bg-[var(--mint)] p-4 text-[var(--forest)]">
                <span className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4" /> {productPreview.length} produk valid</span>
                <span className="text-xs">Duplikat diperiksa saat simpan</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--paper-muted)] text-[0.65rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]"><tr><th className="px-4 py-3">Produk</th><th className="px-4 py-3">Modal</th><th className="px-4 py-3">Target</th></tr></thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {productPreview.slice(0, 8).map((product) => (
                      <tr key={product.id}><td className="px-4 py-3"><p className="font-bold">{product.name}</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{product.brand} · {product.size}</p></td><td className="px-4 py-3 font-medium">{formatCurrency(product.capitalCost)}</td><td className="px-4 py-3 font-medium text-[var(--clay-dark)]">{formatCurrency(product.targetProfit)}</td></tr>
                    ))}
                  </tbody>
                </table>
                {productPreview.length > 8 ? <p className="border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-soft)]">+ {productPreview.length - 8} produk lainnya</p> : null}
              </div>
              <Button className="mt-5 w-full" disabled={!productPreview.length || mutationPending} onClick={() => void commitProducts()}><PackagePlus className="h-4 w-4" /> {importingProducts ? "Mengimpor..." : `Impor ${productPreview.length} produk`}</Button>
            </>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Baris header">
                  <Select value={headerIndex} onChange={(event) => {
                    const index = Number(event.target.value);
                    setHeaderIndex(index);
                    setMapping(autoDetectSalesMapping(activeSheet.rows[index] ?? []));
                    setSalePreview([]);
                  }}>
                    {activeSheet.rows.slice(0, 25).map((row, index) => (
                      <option key={index} value={index}>Baris {index + 1}: {row.filter(Boolean).slice(0, 3).join(" · ") || "Kosong"}</option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-end"><Badge tone="orange">{activeSheet.rows.length - headerIndex - 1} baris data mentah</Badge></div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {mappingLabels.map(([key, label, required]) => (
                  <Field key={key} label={`${label}${required ? " *" : ""}`}>
                    <Select value={mapping[key] ?? ""} onChange={(event) => {
                      setMapping((current) => ({ ...current, [key]: event.target.value === "" ? null : Number(event.target.value) }));
                      setSalePreview([]);
                    }}>
                      <option value="">Tidak dipetakan</option>
                      {headers.map((header, index) => <option key={`${String(header)}-${index}`} value={index}>{String(header || `Kolom ${index + 1}`)}</option>)}
                    </Select>
                  </Field>
                ))}
              </div>

              <div className="mt-5">
                <Switch checked={adjustStock} onChange={setAdjustStock} label="Kurangi stok dari hasil impor" description="Default dimatikan agar impor data historis tidak merusak stok saat ini." />
              </div>

              <Button variant="secondary" className="mt-5 w-full" disabled={mutationPending || !salesFeesReady} onClick={() => void previewSales()}><ReceiptText className="h-4 w-4" /> {previewingSales ? "Mencari produk..." : !salesFeesReady ? "Menunggu fee aktif..." : "Validasi dan buat pratinjau"}</Button>

              {salePreview.length ? (
                <div className="mt-4 rounded-2xl border border-[#86d3a7]/25 bg-[var(--mint)] p-4 text-[var(--forest)]">
                  <p className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4" /> {salePreview.length} transaksi siap diimpor</p>
                  <p className="mt-1 text-xs">{salePreview.filter((sale) => sale.calculationMode === "actual").length} memakai uang diterima aktual.</p>
                </div>
              ) : null}
              {errors.length ? (
                <div className="mt-3 rounded-2xl border border-[#df8b86]/25 bg-[var(--danger-soft)] p-4 text-[#a63d38]">
                  <p className="flex items-center gap-2 text-sm font-bold"><AlertCircle className="h-4 w-4" /> {errors.length} baris dilewati</p>
                  <ul className="mt-2 max-h-24 overflow-y-auto text-xs leading-5">{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
                </div>
              ) : null}
              {salePreview.length ? <Button className="mt-4 w-full" disabled={mutationPending || !salesFeesReady} onClick={() => void commitSales()}><UploadCloud className="h-4 w-4" /> {importingSales ? "Mengimpor..." : `Impor ${salePreview.length} penjualan`}</Button> : null}
            </>
          )}
        </article>
      </section>
    </>
  );
}
