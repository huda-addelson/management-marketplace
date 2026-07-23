import type { LucideIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "@/lib/utils";

export const MetricCard = memo(function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "forest",
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "forest" | "clay" | "amber" | "sage";
  className?: string;
}) {
  const accents = {
    forest: "bg-[var(--mint)] text-[var(--forest)] ring-brand/[0.08]",
    clay: "bg-[#fff0eb] text-[var(--clay-dark)] ring-accent/10",
    amber: "bg-[#fff5db] text-[#8a6115] ring-amber/[0.12]",
    sage: "bg-[#e7f0ed] text-[#376e5e] ring-sage/[0.12]",
  };

  return (
    <article className={cn("paper-card group relative overflow-hidden rounded-[1.35rem] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[0_18px_48px_rgba(25,47,40,0.1)]", className)}>
      <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-brand/[0.22] to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            {label}
          </p>
          <p className="font-display mt-3 text-2xl font-bold tracking-[-0.055em] sm:text-[1.72rem]">
            {value}
          </p>
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-[0.85rem] ring-1 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105", accents[accent])}>
          <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-4 flex items-start gap-2 border-t border-[var(--line)] pt-3 text-[0.7rem] leading-5 text-[var(--ink-soft)]">
        <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--clay)]" />
        <span>{detail}</span>
      </p>
    </article>
  );
});
