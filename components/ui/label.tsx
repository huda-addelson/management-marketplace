import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[0.72rem] font-bold tracking-[-0.005em] text-[var(--ink)]">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-[var(--ink-soft)]">{hint}</span>
      ) : null}
    </label>
  );
}
