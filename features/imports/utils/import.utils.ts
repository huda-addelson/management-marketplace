import { calculateSale, resolveFees } from "@/features/pricing/utils/pricing.utils";
import { createId, parseCurrency } from "@/lib/utils";
import type { FeeRule, Product, Sale } from "@/types/domain";

export type TabularRow = unknown[];

export interface ParsedSheet {
  name: string;
  rows: TabularRow[];
}

export interface SalesColumnMapping {
  orderNumber: number | null;
  soldAt: number | null;
  productName: number | null;
  sku: number | null;
  quantity: number | null;
  unitSellingPrice: number | null;
  unitCapitalCost: number | null;
  extraCost: number | null;
  receivedAmount: number | null;
  notes: number | null;
}

export const emptySalesMapping: SalesColumnMapping = {
  orderNumber: null,
  soldAt: null,
  productName: null,
  sku: null,
  quantity: null,
  unitSellingPrice: null,
  unitCapitalCost: null,
  extraCost: null,
  receivedAmount: null,
  notes: null,
};

export async function parseTabularFile(file: File): Promise<ParsedSheet[]> {
  if (file.name.toLocaleLowerCase().endsWith(".csv")) {
    const Papa = (await import("papaparse")).default;
    const content = await file.text();
    const parsed = Papa.parse<unknown[]>(content, {
      skipEmptyLines: false,
    });
    if (parsed.errors.length && !parsed.data.length) {
      throw new Error(parsed.errors[0]?.message ?? "CSV tidak dapat dibaca.");
    }
    return [{ name: file.name.replace(/\.csv$/i, ""), rows: parsed.data }];
  }

  const readXlsxFile = (await import("read-excel-file/browser")).default;
  const sheets = await readXlsxFile(file);
  return sheets.map((sheet) => ({ name: sheet.sheet, rows: sheet.data }));
}

function text(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "").trim();
}

function normalized(value: unknown) {
  return text(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findProductHeaderRow(rows: TabularRow[]) {
  return rows.findIndex((row) => {
    const values = row.map(normalized);
    return values.some((value) => value.includes("nama produk")) &&
      values.some((value) => value.includes("harga asli") || value.includes("modal")) &&
      values.some((value) => value.includes("target keuntungan"));
  });
}

export function parsePricingProducts(rows: TabularRow[]): Product[] {
  const headerIndex = findProductHeaderRow(rows);
  if (headerIndex < 0) {
    throw new Error("Header Nama Produk, Harga Asli, dan Target Keuntungan tidak ditemukan.");
  }

  const header = rows[headerIndex] ?? [];
  const headerLabels = header.map(normalized);
  const nameIndex = headerLabels.findIndex((value) => value.includes("nama produk"));
  const capitalIndex = headerLabels.findIndex(
    (value) => value.includes("harga asli") || value === "modal",
  );
  const targetIndex = headerLabels.findIndex((value) => value.includes("target keuntungan"));
  const firstHeader = text(header[0]);
  let currentBrand = firstHeader && !/brand|scentco/i.test(firstHeader)
    ? firstHeader
    : firstHeader || "Tanpa brand";
  if (/^brand$/i.test(currentBrand)) currentBrand = "Tanpa brand";
  let currentSize = "";
  const now = new Date().toISOString();
  const result: Product[] = [];

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const firstCell = text(row[0]);
    const sizeCell = text(row[1]);
    const name = text(row[nameIndex]);

    if (firstCell) currentBrand = firstCell;
    if (sizeCell) currentSize = sizeCell;
    if (!name) continue;

    result.push({
      id: createId("product"),
      brand: currentBrand || "Tanpa brand",
      size: currentSize,
      name,
      sku: "",
      capitalCost: parseCurrency(row[capitalIndex]),
      targetProfit: parseCurrency(row[targetIndex]),
      stock: 0,
      lowStockThreshold: 3,
      feeOverrides: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  return result;
}

export function findLikelyHeaderRow(rows: TabularRow[]) {
  const scored = rows.slice(0, 25).map((row, index) => ({
    index,
    score: row.filter((cell) => text(cell)).length,
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0]?.index ?? 0;
}

export function autoDetectSalesMapping(headers: unknown[]): SalesColumnMapping {
  const labels = headers.map(normalized);
  const find = (...patterns: RegExp[]) => {
    const index = labels.findIndex((label) => patterns.some((pattern) => pattern.test(label)));
    return index >= 0 ? index : null;
  };

  return {
    orderNumber: find(/nomor pesanan/, /no pesanan/, /order sn/, /order number/),
    soldAt: find(/tanggal selesai/, /waktu pesanan/, /tanggal pesanan/, /^tanggal$/, /completed at/),
    productName: find(/nama produk/, /product name/, /^produk$/),
    sku: find(/^sku$/, /sku produk/, /model sku/),
    quantity: find(/kuantitas/, /^jumlah$/, /^qty$/, /quantity/),
    unitSellingPrice: find(/harga jual per unit/, /harga produk/, /selling price/, /^harga jual$/),
    unitCapitalCost: find(/harga modal/, /^modal$/, /^hpp$/, /unit cost/),
    extraCost: find(/biaya tambahan/, /biaya kemasan/, /extra cost/),
    receivedAmount: find(/uang diterima/, /penghasilan bersih/, /net income/, /escrow amount/),
    notes: find(/^catatan$/, /^notes?$/),
  };
}

function cell(row: TabularRow, index: number | null) {
  return index === null ? undefined : row[index];
}

function normalizeDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = text(value);
  if (!raw) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return new Date().toISOString().slice(0, 10);
}

export function buildSalesFromRows({
  rows,
  headerIndex,
  mapping,
  products,
  fees,
}: {
  rows: TabularRow[];
  headerIndex: number;
  mapping: SalesColumnMapping;
  products: Product[];
  fees: FeeRule[];
}) {
  const sales: Sale[] = [];
  const errors: string[] = [];
  const now = new Date().toISOString();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const productNameValue = text(cell(row, mapping.productName));
    const skuValue = text(cell(row, mapping.sku));
    if (!productNameValue && !skuValue) return;

    const product = products.find((item) =>
      (skuValue && item.sku.toLocaleLowerCase() === skuValue.toLocaleLowerCase()) ||
      (productNameValue && item.name.toLocaleLowerCase() === productNameValue.toLocaleLowerCase()),
    );
    const quantity = Math.max(1, parseCurrency(cell(row, mapping.quantity)) || 1);
    const unitSellingPrice = parseCurrency(cell(row, mapping.unitSellingPrice));
    if (unitSellingPrice <= 0) {
      errors.push(`Baris ${rowNumber}: harga jual tidak valid.`);
      return;
    }

    const unitCapitalCost = mapping.unitCapitalCost !== null
      ? parseCurrency(cell(row, mapping.unitCapitalCost))
      : product?.capitalCost ?? 0;
    const extraCost = parseCurrency(cell(row, mapping.extraCost));
    const selectedFees = resolveFees(fees, product?.feeOverrides ?? {}, "products");
    const estimated = calculateSale({
      unitSellingPrice,
      quantity,
      unitCapitalCost,
      extraCost,
      fees: selectedFees,
    });
    const actualReceived = mapping.receivedAmount !== null
      ? parseCurrency(cell(row, mapping.receivedAmount))
      : null;
    const receivedAmount = actualReceived ?? estimated.receivedAmount;
    const grossRevenue = unitSellingPrice * quantity;
    const totalCapitalCost = unitCapitalCost * quantity;
    const orderNumber = text(cell(row, mapping.orderNumber)) || `IMP-${Date.now()}-${rowNumber}`;

    sales.push({
      id: createId("sale"),
      orderNumber,
      soldAt: normalizeDate(cell(row, mapping.soldAt)),
      source: "import",
      calculationMode: actualReceived === null ? "estimated" : "actual",
      stockAdjusted: false,
      productId: product?.id ?? null,
      productName: product?.name ?? (productNameValue || skuValue),
      sku: product?.sku || skuValue,
      quantity,
      unitSellingPrice,
      grossRevenue,
      receivedAmount,
      unitCapitalCost,
      totalCapitalCost,
      extraCost,
      totalFees: grossRevenue - receivedAmount,
      profit: receivedAmount - totalCapitalCost - extraCost,
      feeSnapshot: actualReceived === null ? estimated.fees : [],
      notes: text(cell(row, mapping.notes)),
      createdAt: now,
      updatedAt: now,
    });
  });

  return { sales, errors };
}
