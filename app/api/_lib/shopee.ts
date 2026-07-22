import type { PostgrestError } from "@supabase/supabase-js";

import { ApiRouteError } from "@/app/api/_lib/http";
import type {
  AppliedFee,
  DecantRecipe,
  FeeAppliesPer,
  FeeKind,
  FeeRule,
  Product,
  Sale,
  SaleSource,
  VialCost,
} from "@/types/domain";

export type DatabaseRow = Record<string, unknown>;

export function assertDatabaseResult(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "42883") {
    throw new ApiRouteError(
      "Schema pagination belum terpasang. Jalankan supabase/schema.sql di SQL Editor.",
      503,
      error.code,
    );
  }
  if (error.code === "23505") {
    throw new ApiRouteError("Data dengan nilai yang sama sudah tersedia.", 409, error.code);
  }
  throw new ApiRouteError(error.message, 400, error.code);
}

export function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, boolean>)
    : {};
}

export function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function compact<T extends DatabaseRow>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

export function rpcObject(data: unknown): DatabaseRow {
  if (Array.isArray(data)) return (data[0] ?? {}) as DatabaseRow;
  return (data ?? {}) as DatabaseRow;
}

export function safeSearch(value: string) {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();
}

export function mapProduct(row: DatabaseRow): Product {
  return {
    id: stringValue(row.id),
    brand: stringValue(row.brand),
    size: stringValue(row.size),
    name: stringValue(row.name),
    sku: stringValue(row.sku),
    capitalCost: numberValue(row.capital_cost),
    targetProfit: numberValue(row.target_profit),
    stock: numberValue(row.stock),
    lowStockThreshold: numberValue(row.low_stock_threshold),
    feeOverrides: objectValue(row.fee_overrides),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

export function productRow(product: Partial<Product>) {
  return compact({
    id: product.id,
    brand: product.brand,
    size: product.size,
    name: product.name,
    sku: product.sku,
    capital_cost: product.capitalCost,
    target_profit: product.targetProfit,
    stock: product.stock,
    low_stock_threshold: product.lowStockThreshold,
    fee_overrides: product.feeOverrides,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });
}

export function mapSale(row: DatabaseRow): Sale {
  return {
    id: stringValue(row.id),
    orderNumber: stringValue(row.order_number),
    soldAt: stringValue(row.sold_at),
    source: stringValue(row.source) as SaleSource,
    calculationMode: stringValue(row.calculation_mode) as Sale["calculationMode"],
    stockAdjusted: Boolean(row.stock_adjusted),
    stockDelta: numberValue(row.stock_delta),
    productId: row.product_id ? stringValue(row.product_id) : null,
    productName: stringValue(row.product_name),
    sku: stringValue(row.sku),
    quantity: numberValue(row.quantity),
    unitSellingPrice: numberValue(row.unit_selling_price),
    grossRevenue: numberValue(row.gross_revenue),
    receivedAmount: numberValue(row.received_amount),
    unitCapitalCost: numberValue(row.unit_capital_cost),
    totalCapitalCost: numberValue(row.total_capital_cost),
    extraCost: numberValue(row.extra_cost),
    totalFees: numberValue(row.total_fees),
    profit: numberValue(row.profit),
    feeSnapshot: arrayValue(row.fee_snapshot) as AppliedFee[],
    notes: stringValue(row.notes),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

export function mapFee(row: DatabaseRow): FeeRule {
  return {
    id: stringValue(row.id),
    name: stringValue(row.name),
    kind: stringValue(row.kind) as FeeKind,
    value: numberValue(row.value),
    appliesPer: stringValue(row.applies_per) as FeeAppliesPer,
    capAmount: row.cap_amount === null ? null : numberValue(row.cap_amount),
    active: Boolean(row.active),
    defaultForProducts: Boolean(row.default_for_products),
    defaultForDecants: Boolean(row.default_for_decants),
    effectiveFrom: stringValue(row.effective_from),
    archivedAt: row.archived_at ? stringValue(row.archived_at) : null,
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

export function feeRow(fee: Partial<FeeRule>) {
  return compact({
    id: fee.id,
    name: fee.name,
    kind: fee.kind,
    value: fee.value,
    applies_per: fee.appliesPer,
    cap_amount: fee.capAmount,
    active: fee.active,
    default_for_products: fee.defaultForProducts,
    default_for_decants: fee.defaultForDecants,
    effective_from: fee.effectiveFrom,
    archived_at: fee.archivedAt,
    created_at: fee.createdAt,
    updated_at: fee.updatedAt,
  });
}

export function mapVial(row: DatabaseRow): VialCost {
  return {
    id: stringValue(row.id),
    sizeMl: numberValue(row.size_ml),
    cost: numberValue(row.cost),
    active: Boolean(row.active),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

export function vialRow(vial: Partial<VialCost>) {
  return compact({
    id: vial.id,
    size_ml: vial.sizeMl,
    cost: vial.cost,
    active: vial.active,
    created_at: vial.createdAt,
    updated_at: vial.updatedAt,
  });
}

export function mapDecant(row: DatabaseRow): DecantRecipe {
  return {
    id: stringValue(row.id),
    name: stringValue(row.name),
    concentration: stringValue(row.concentration),
    fullBottleCost: numberValue(row.full_bottle_cost),
    bottleVolumeMl: numberValue(row.bottle_volume_ml),
    decantSizeMl: numberValue(row.decant_size_ml),
    vialCostId: row.vial_cost_id ? stringValue(row.vial_cost_id) : null,
    bubbleWrapCost: numberValue(row.bubble_wrap_cost),
    stickerCost: numberValue(row.sticker_cost),
    cardCost: numberValue(row.card_cost),
    targetProfit: numberValue(row.target_profit),
    wholesaleTwoDiscount: numberValue(row.wholesale_two_discount),
    wholesaleThreeDiscount: numberValue(row.wholesale_three_discount),
    feeOverrides: objectValue(row.fee_overrides),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

export function decantRow(decant: Partial<DecantRecipe>) {
  return compact({
    id: decant.id,
    name: decant.name,
    concentration: decant.concentration,
    full_bottle_cost: decant.fullBottleCost,
    bottle_volume_ml: decant.bottleVolumeMl,
    decant_size_ml: decant.decantSizeMl,
    vial_cost_id: decant.vialCostId,
    bubble_wrap_cost: decant.bubbleWrapCost,
    sticker_cost: decant.stickerCost,
    card_cost: decant.cardCost,
    target_profit: decant.targetProfit,
    wholesale_two_discount: decant.wholesaleTwoDiscount,
    wholesale_three_discount: decant.wholesaleThreeDiscount,
    fee_overrides: decant.feeOverrides,
    created_at: decant.createdAt,
    updated_at: decant.updatedAt,
  });
}
