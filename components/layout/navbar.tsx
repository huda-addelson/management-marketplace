"use client";

import { LoaderCircle, LogOut } from "lucide-react";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/api/settings.query";
import { useAuthContext, useDataContext } from "@/providers";

export function Navbar() {
  const { mode, signingOut, signOut } = useAuthContext();
  const { syncStatus } = useDataContext();
  const settingsQuery = useSettings();
  const settings = settingsQuery.data;

  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-[var(--line)] bg-[#f7f9f7]/[0.82] px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <AddelsonLogo size={42} priority />
        <div><p className="font-display text-base font-bold leading-none tracking-[-0.04em]">Addelson Store</p><p className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">Margin Studio</p></div>
      </div>
      <div className="hidden lg:block">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[var(--ink-soft)]">Workspace aktif</p>
        <p className="mt-0.5 text-sm font-bold">
          {settingsQuery.isPending ? "Memuat profil toko..." : settingsQuery.isError ? "Profil toko gagal dimuat" : settings?.storeName ?? "Workspace toko"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={mode === "supabase" ? "green" : "orange"}>
          {mode === "supabase" ? (syncStatus === "error" ? "Bermasalah" : syncStatus === "loading" ? "Menyinkronkan" : "Tersinkron") : "Lokal"}
        </Badge>
        {mode === "supabase" ? (
          <Button variant="ghost" size="icon" disabled={signingOut} className="lg:hidden" onClick={() => void signOut()} aria-label={signingOut ? "Mengakhiri sesi" : "Keluar"}>
            {signingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
