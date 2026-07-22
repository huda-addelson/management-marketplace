import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, disabled, ...props }, ref) => (
    <div className="relative min-w-0">
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "h-12 w-full appearance-none rounded-[0.9rem] border border-[var(--line-strong)] bg-white/[0.9] py-0 pl-3.5 pr-10 text-sm font-medium text-[var(--ink)] shadow-[0_1px_2px_rgba(15,33,28,0.035)] outline-none transition-all hover:border-brand/[0.28] focus:border-brand/[0.45] focus:bg-white focus:ring-4 focus:ring-brand/[0.08] disabled:cursor-not-allowed disabled:bg-black/[0.03]",
          className,
        )}
        {...props}
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
    </div>
  ),
);
Select.displayName = "Select";
