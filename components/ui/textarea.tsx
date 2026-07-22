import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-y rounded-[0.9rem] border border-[var(--line-strong)] bg-white/[0.9] px-3.5 py-3 text-sm font-medium text-[var(--ink)] shadow-[0_1px_2px_rgba(15,33,28,0.035)] outline-none transition-all placeholder:font-normal placeholder:text-black/[0.28] hover:border-brand/[0.28] focus:border-brand/[0.45] focus:bg-white focus:ring-4 focus:ring-brand/[0.08] disabled:cursor-not-allowed disabled:bg-black/[0.03]",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
