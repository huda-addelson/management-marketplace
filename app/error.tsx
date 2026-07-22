"use client";

import { AlertCircle } from "lucide-react";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="paper-card max-w-md rounded-3xl p-8 text-center">
        <AddelsonLogo size={72} className="mx-auto mb-5" priority />
        <AlertCircle className="mx-auto h-9 w-9 text-[var(--danger)]" />
        <h1 className="font-display mt-4 text-3xl font-bold">Halaman gagal dimuat.</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Coba ulang permintaan. Data yang sudah tersimpan tetap aman.</p>
        <Button className="mt-6" onClick={reset}>Coba lagi</Button>
      </div>
    </div>
  );
}
