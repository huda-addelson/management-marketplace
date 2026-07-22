import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[var(--forest)] text-white shadow-[0_8px_20px_rgba(21,63,54,0.18)] hover:-translate-y-0.5 hover:bg-[var(--forest-light)] hover:shadow-[0_12px_26px_rgba(21,63,54,0.22)]",
        accent: "bg-[var(--clay)] text-white shadow-[0_8px_20px_rgba(241,109,75,0.18)] hover:-translate-y-0.5 hover:brightness-95",
        secondary: "border border-[var(--line-strong)] bg-white/[0.85] text-[var(--ink)] shadow-sm hover:-translate-y-0.5 hover:border-brand/[0.35] hover:bg-white hover:shadow-md",
        ghost: "text-[var(--ink-soft)] hover:bg-black/[0.045] hover:text-[var(--ink)]",
        danger: "bg-[var(--danger)] text-white shadow-[0_8px_20px_rgba(207,76,70,0.16)] hover:-translate-y-0.5 hover:brightness-95",
      },
      size: {
        sm: "h-9 rounded-[0.7rem] px-3.5 text-xs",
        md: "h-11 rounded-[0.8rem] px-4 text-sm",
        lg: "h-12 rounded-[0.9rem] px-5 text-sm",
        icon: "h-10 w-10 rounded-[0.75rem]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
