"use client";

import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AddelsonLogo } from "@/components/shared/addelson-logo";
import { Button } from "@/components/ui/button";
import { FullScreenLoadingState } from "@/components/common/query-state";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { useAuthContext } from "@/providers/auth-provider";

import { useLoginMutation } from "../api/auth.mutation";

const highlights = [
  "Harga jual otomatis mengikuti potongan aktif",
  "Snapshot biaya menjaga laporan historis",
  "Produk, decant, penjualan, dan impor dalam satu workspace",
];

function getDestination() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : ROUTES.dashboard;
}

export default function LoginPage() {
  const router = useRouter();
  const { ready, user } = useAuthContext();
  const loginMutation = useLoginMutation();
  const configured = isSupabaseConfigured;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loading = loginMutation.isPending;

  useEffect(() => {
    if (ready && user) router.replace(getDestination());
  }, [ready, router, user]);

  if (!ready || user) {
    return (
      <FullScreenLoadingState
        title={user ? "Membuka dashboard..." : "Memeriksa sesi admin..."}
        description="Menyiapkan akses aman ke workspace Addelson Store."
      />
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!configured) {
      router.replace(getDestination());
      return;
    }
    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success("Login berhasil.");
      router.replace(getDestination());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email atau password tidak sesuai.");
    }
  };

  return (
    <main className="grid min-h-screen bg-[var(--canvas)] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.72fr)] lg:p-3">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,var(--nav)_0%,#19483d_100%)] p-12 text-white shadow-[var(--shadow-strong)] lg:flex lg:flex-col xl:p-16">
        <div className="subtle-grid absolute inset-0 opacity-45" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mint-strong/[0.12] blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-accent/[0.12] blur-3xl" />
        <div className="relative flex items-center gap-3">
          <AddelsonLogo size={64} priority />
          <div>
            <p className="font-display text-2xl font-bold tracking-[-0.045em]">Addelson Store</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/50">
              Profit intelligence
            </p>
          </div>
        </div>

        <div className="relative my-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--mint-strong)]">
            Dibangun untuk seller parfum
          </p>
          <h1 className="font-display mt-5 text-6xl font-bold leading-[0.94] tracking-[-0.06em] xl:text-7xl">
            Jangan biarkan fee marketplace memakan margin diam-diam.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
            Tentukan uang yang ingin diterima. Sistem menghitung harga yang perlu dipasang.
          </p>
          <div className="mt-9 space-y-3">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-center gap-3 text-sm text-white/[0.72]">
                <CheckCircle2 className="h-4 w-4 text-[var(--mint-strong)]" />
                {highlight}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/35">
          Data toko dilindungi Row Level Security dan hanya dapat dibaca oleh akun Anda.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="paper-card w-full max-w-md rounded-[1.8rem] p-6 sm:p-8 lg:border-transparent lg:bg-white/70 lg:shadow-none">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <AddelsonLogo size={56} priority />
            <div>
              <p className="font-display text-xl font-bold tracking-[-0.045em]">Addelson Store</p>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Profit intelligence</p>
            </div>
          </div>

          <p className="eyebrow">Admin workspace</p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.055em]">
            {configured ? "Selamat datang kembali." : "Mode lokal siap dipakai."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            {configured
              ? "Masuk menggunakan akun admin yang dibuat di Supabase Auth."
              : "Supabase belum dikonfigurasi. Anda dapat masuk ke workspace lokal dan data akan tersimpan di browser ini."}
          </p>

          {configured ? (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <Field label="Email admin">
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@toko.com"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                <LockKeyhole className="h-4 w-4" />
                {loading ? "Memeriksa akun..." : "Masuk ke dashboard"}
              </Button>
            </form>
          ) : (
            <Button size="lg" className="mt-8 w-full" onClick={() => router.replace(getDestination())}>
              Buka workspace lokal <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <div className="mt-7 rounded-2xl border border-[var(--line)] bg-[var(--paper-muted)] p-4 text-xs leading-5 text-[var(--ink-soft)]">
            Tidak ada pendaftaran publik. Buat satu pengguna admin melalui
            <strong className="text-[var(--ink)]"> Supabase Dashboard → Authentication → Users</strong>.
          </div>
        </div>
      </section>
    </main>
  );
}
