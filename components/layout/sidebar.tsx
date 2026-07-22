"use client";

import {
  Cloud,
  CloudOff,
  LogOut,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Button } from "@/components/ui/button";
import { SIDEBAR_ITEMS, ROUTES } from "@/constants";
import { useSettings } from "@/features/settings/api/settings.query";
import { cn } from "@/lib/utils";
import { useAuthContext, useDataContext } from "@/providers";
import { useSidebarStore } from "@/store/sidebar.store";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  const { mode, user, signingOut, signOut } = useAuthContext();
  const { syncStatus } = useDataContext();
  const settingsQuery = useSettings();
  const settings = settingsQuery.data;

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-30 hidden flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[var(--nav)] px-3 py-4 text-white shadow-[0_24px_70px_rgba(9,24,20,0.2)] transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-mint-strong/10 blur-3xl" />
        <Link href={ROUTES.dashboard} className="relative flex items-center gap-3 px-0.5 py-1">
          <AddelsonLogo size={44} priority />
          {!collapsed ? (
            <span className="min-w-0">
              <span className="font-display block text-xl font-bold tracking-[-0.04em]">Addelson Store</span>
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.21em] text-white/40">Margin Studio</span>
            </span>
          ) : null}
        </Link>

        {!collapsed ? <p className="relative mt-9 px-3 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/30">Workspace</p> : null}
        <nav className={cn("relative space-y-1", collapsed ? "mt-8" : "mt-3")}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-[0.9rem] text-[0.82rem] font-semibold transition-all",
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? "bg-[var(--mint)] text-[var(--forest)] shadow-[0_8px_22px_rgba(0,0,0,0.14)]"
                    : "text-white/55 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                <item.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                {!collapsed ? <span className="flex-1">{item.label}</span> : null}
                {!collapsed && active ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--clay)]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto">
          {!collapsed ? (
            <div className="mb-2 rounded-[1.15rem] border border-white/[0.09] bg-white/[0.055] p-4">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {mode === "supabase" ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
                {mode === "supabase" ? "Supabase aktif" : "Mode lokal"}
              </div>
              <p className="mt-2 line-clamp-1 text-[0.68rem] text-white/40">
                {mode === "supabase"
                  ? syncStatus === "error" ? "Sinkronisasi bermasalah" : user?.email
                  : settingsQuery.isPending ? "Memuat profil toko..." : settingsQuery.isError ? "Profil toko gagal dimuat" : settings?.storeName}
              </p>
              {mode === "supabase" ? (
                <Button variant="ghost" size="sm" disabled={signingOut} className="mt-3 w-full text-white/65 hover:bg-white/10 hover:text-white" onClick={() => void signOut()}>
                  {signingOut ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  {signingOut ? "Mengakhiri sesi..." : "Keluar"}
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button variant="ghost" size="icon" className="w-full text-white/45 hover:bg-white/10 hover:text-white" onClick={toggle} aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <nav className="hide-scrollbar fixed inset-x-3 bottom-3 z-40 flex h-[4.25rem] items-center gap-1 overflow-x-auto rounded-[1.35rem] border border-black/[0.08] bg-white/[0.92] px-2 shadow-[0_18px_50px_rgba(15,35,29,0.2)] backdrop-blur-2xl lg:hidden">
        {SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-[0.9rem] py-2 text-[0.58rem] font-bold transition-all", active ? "bg-[var(--nav)] text-white shadow-md" : "text-[var(--ink-soft)]")}>
              <item.icon className="h-4 w-4" />
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
