import Link from "next/link";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="paper-card rounded-3xl px-6 py-20 text-center">
      <AddelsonLogo size={72} className="mx-auto" priority />
      <p className="eyebrow mt-5">404</p>
      <h1 className="font-display mt-2 text-4xl font-semibold">Halaman tidak ditemukan.</h1>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">Tautan mungkin sudah berubah atau tidak tersedia.</p>
      <Button className="mt-6" asChild><Link href="/dashboard">Kembali ke dashboard</Link></Button>
    </div>
  );
}
