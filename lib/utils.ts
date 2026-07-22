import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function parseCurrency(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replace(/[^0-9-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercentage(value: unknown) {
  if (typeof value === "number") {
    return value > 0 && value < 1 ? value * 100 : value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replace(/%/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${random}`;
}
