"use client";

import {
  AlertTriangle,
  Inbox,
  LoaderCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function QueryLoadingState({
  title = "Menyiapkan data toko...",
  description = "Mengambil data terbaru tanpa mengubah data yang sudah tersimpan.",
  cards = 4,
  compact = false,
  className,
}: {
  title?: string;
  description?: string;
  cards?: number;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--paper-muted)] px-3 py-2.5 text-xs font-semibold text-[var(--ink-soft)]", className)} role="status">
        <LoaderCircle className="h-4 w-4 animate-spin text-[var(--forest)]" />
        {title}
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)} role="status" aria-label={title}>
      <div className="flex items-center gap-4">
        <AddelsonLogo size={58} priority />
        <div>
          <p className="font-display text-xl font-bold tracking-[-0.035em]">{title}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="paper-card space-y-4 rounded-[1.35rem] p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-[1.6rem]" />
    </div>
  );
}

export function FullScreenLoadingState({
  title = "Menyiapkan Addelson Store...",
  description = "Mohon tunggu sebentar.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-6" role="status" aria-label={title}>
      <div className="text-center">
        <AddelsonLogo size={96} className="mx-auto" priority />
        <LoaderCircle className="mx-auto mt-6 h-5 w-5 animate-spin text-blue-600" />
        <p className="font-display mt-4 text-xl font-bold tracking-[-0.035em]">{title}</p>
        <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{description}</p>
      </div>
    </div>
  );
}

export function QueryErrorState({
  title = "Data belum berhasil dimuat.",
  description,
  error,
  onRetry,
  compact = false,
  className,
}: {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void | Promise<unknown>;
  compact?: boolean;
  className?: string;
}) {
  const detail = description ?? errorMessage(error, "Periksa koneksi, lalu coba ambil data kembali.");

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-red-200 bg-red-50/80 text-red-950",
        compact ? "flex items-start gap-3 p-3.5" : "paper-card p-6 sm:p-8",
        className,
      )}
      role="alert"
    >
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-red-100 text-[var(--danger)]", compact ? "h-8 w-8" : "h-11 w-11")}>
        <AlertTriangle className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <div className={cn(!compact && "mt-4")}>
        <p className={cn("font-bold", !compact && "font-display text-2xl tracking-[-0.035em]")}>{title}</p>
        <p className={cn("leading-6 text-red-800/75", compact ? "mt-0.5 text-xs" : "mt-2 max-w-2xl text-sm")}>{detail}</p>
        {onRetry ? (
          <Button variant="secondary" size={compact ? "sm" : "md"} className={compact ? "mt-2.5" : "mt-5"} onClick={() => void onRetry()}>
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function QueryEmptyState({
  title = "Belum ada data.",
  description = "Tambahkan data pertama untuk mulai menggunakan bagian ini.",
  icon: Icon = Inbox,
  action,
  compact = false,
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "min-h-40 p-5" : "min-h-64 rounded-[1.35rem] border border-dashed border-[var(--line)] bg-[var(--paper-muted)] p-8", className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--ink-soft)] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--ink-soft)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FetchingIndicator({
  active,
  label = "Memperbarui data...",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) return null;

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[0.68rem] font-bold text-sky-800", className)} role="status">
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      {label}
    </div>
  );
}

export function TableLoadingRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }).map((_, row) => (
    <tr key={row}>
      {Array.from({ length: columns }).map((__, column) => (
        <td key={column} className="px-4 py-4">
          <Skeleton className={cn("h-4", column === 0 ? "w-36" : "w-20")} />
        </td>
      ))}
    </tr>
  ));
}
