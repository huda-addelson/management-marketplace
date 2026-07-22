"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const [mobileViewportStyle, setMobileViewportStyle] = useState<CSSProperties>();

  useEffect(() => {
    if (!open || !window.visualViewport) {
      setMobileViewportStyle(undefined);
      return;
    }
    const viewport = window.visualViewport;
    const updatePosition = () => {
      if (!window.matchMedia("(max-width: 1023px)").matches) {
        setMobileViewportStyle(undefined);
        return;
      }
      const keyboardOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setMobileViewportStyle({
        bottom: `${keyboardOffset + 8}px`,
        maxHeight: `${Math.max(240, viewport.height - 16)}px`,
      });
    };
    updatePosition();
    viewport.addEventListener("resize", updatePosition);
    viewport.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      viewport.removeEventListener("resize", updatePosition);
      viewport.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#08110f]/[0.55] backdrop-blur-md data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          style={mobileViewportStyle}
          className={cn(
            "fixed bottom-2 left-1/2 z-50 max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-[1.6rem] border border-white/[0.6] bg-[var(--paper)] shadow-float focus:outline-none data-[state=open]:animate-fade-in lg:bottom-auto lg:top-1/2 lg:max-h-[calc(100dvh-2rem)] lg:w-[calc(100%-2rem)] lg:-translate-y-1/2",
            className,
          )}
        >
          <div className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/[0.9] px-5 py-4 pr-16 backdrop-blur-xl sm:px-7 sm:py-5">
            <DialogPrimitive.Title className="font-display text-2xl font-bold tracking-[-0.045em] text-[var(--ink)]">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{description}</DialogPrimitive.Description> : null}
          </div>
          <DialogPrimitive.Close className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-xl text-[var(--ink-soft)] transition hover:bg-black/[0.05] hover:text-[var(--ink)] sm:right-4 sm:top-4">
            <X className="h-5 w-5" />
            <span className="sr-only">Tutup</span>
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
