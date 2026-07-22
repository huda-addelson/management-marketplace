# Addelson Margin

Dashboard harga dan profit untuk toko parfum Shopee. Project ini berdiri sendiri, dengan struktur feature-first dan pola data access yang mengikuti `finance-dashboard` tanpa memiliki dependency runtime terhadap project referensi tersebut.

## Fitur

- Kalkulator harga jual Shopee berdasarkan modal, target keuntungan, potongan persentase, dan biaya tetap.
- CRUD produk dan override potongan per produk.
- CRUD potongan dengan tanggal berlaku, batas maksimum opsional, serta snapshot transaksi.
- Kalkulator decant: modal/ml, vial, biaya tambahan, affiliate, grosir, stok/botol, omzet, dan cuan.
- CRUD biaya vial dan label.
- Penjualan manual dengan pengurangan stok opsional.
- Impor daftar harga dari format spreadsheet Addelson.
- Impor CSV/XLSX penjualan dengan pemetaan kolom fleksibel.
- Pagination sumber data untuk produk, penjualan, potongan, resep decant, dan biaya vial.
- Agregasi dashboard melalui RPC sehingga total tidak dihitung dari page aktif.
- Mode lokal tanpa konfigurasi dan sinkronisasi Supabase saat environment tersedia.
- Login satu admin dan Row Level Security.

## Rumus Produk

```text
Harga Jual = (Modal + Target Keuntungan + Total Biaya Tetap)
             / (1 - Total Persentase Potongan)

Uang Diterima = Harga Jual - Potongan Persentase - Biaya Tetap
```

Nilai awal mengikuti spreadsheet:

- Biaya Admin 8,25%
- Gratis Ongkir XTRA 5,50%
- Promo XTRA 4,50%
- Asuransi 0,50%
- Biaya Proses Pesanan Rp1.250
- Affiliate 10% untuk decant

## Arsitektur

Setiap domain memiliki data access sendiri di `features/<domain>/api`:

```text
component
  -> feature query atau mutation hook
  -> feature service
  -> domain store (mode lokal)
     atau Next.js API route -> Supabase
```

Contoh untuk produk:

- `features/products/api/product.query.ts` menyimpan query keys dan hook GET.
- `features/products/api/product.mutation.ts` menangani create, update, delete, import, dan cache invalidation.
- `features/products/api/product.service.ts` memilih mode lokal atau memanggil HTTP API.
- `app/api/products` menangani auth, validasi, pagination, dan query Supabase seperti route handler pada `finance-dashboard`.
- `app/api/_lib/shopee.ts` hanya berisi mapper dan normalizer database, setara dengan `app/api/_lib/finance.ts` pada project referensi.

Pola yang sama digunakan oleh `auth`, `sales`, `fees`, `decants`, `dashboard`, dan `settings`. Endpoint khusus memakai subroute eksplisit seperti `/api/products/options`, `/api/sales/summary`, dan `/api/fees/active`, bukan parameter `view` atau `operation`.

Store mengikuti peletakan root `store/` pada `finance-dashboard` dan dipisahkan per domain:

- `store/auth.store.ts`
- `store/product.store.ts`
- `store/sale.store.ts`
- `store/fee.store.ts`
- `store/decant.store.ts`
- `store/settings.store.ts`
- `store/sidebar.store.ts`

Tidak ada global workspace repository, query key `workspace-data`, `*.server.ts` di dalam fitur, atau aggregate `local-data.store.ts`. Data browser lama dari `addelson-profit-workspace` dimigrasikan satu kali ke persistence key masing-masing domain tanpa dibuang sebelum seluruh store baru berhasil diisi.

Stack utama menggunakan Next.js 15, React 18, Tailwind CSS 3, TanStack Query, Axios, Zustand, Zod, Radix UI, dan Supabase. Next.js memakai patch aman yang kompatibel, bukan versi Next 14 rentan dari project referensi.

## Menjalankan Lokal

```powershell
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000`. Tanpa `.env.local`, aplikasi berjalan dalam mode lokal dan menyimpan data ke `localStorage` browser.

## Supabase

1. Buat project baru di [Supabase](https://supabase.com/dashboard).
2. Jalankan `supabase/schema.sql` melalui SQL Editor.
3. Buat satu pengguna admin melalui **Authentication → Users**.
4. Nonaktifkan pendaftaran publik jika tidak diperlukan.
5. Buat `.env.local` berdasarkan `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Setelah environment terpasang, login wajib dan data disimpan dalam tabel terpisah: `workspace_profiles`, `fee_rules`, `products`, `vial_costs`, `decant_recipes`, dan `sales`. Semua tabel dilindungi RLS berdasarkan `auth.uid()`.

### Upgrade dari Schema Lama

Jalankan kembali `supabase/schema.sql` **sebelum** men-deploy versi aplikasi ini. Saat login pertama setelah upgrade, fungsi `bootstrap_workspace` akan memindahkan isi `workspace_states.data` ke tabel terpisah langsung di PostgreSQL. Browser tidak mengunduh snapshot lama untuk melakukan migrasi.

Tabel `workspace_states` dipertahankan sebagai sumber migrasi/rollback, tetapi aplikasi tidak lagi membaca atau menulis tabel tersebut setelah profile schema versi 2 tersedia.

### Pagination

- List utama menggunakan pilihan 10, 20, atau 50 data per halaman.
- Query Supabase selalu memakai `range()` dengan batas maksimum 100 row.
- Search dan filter produk/penjualan dijalankan sebelum pagination di database.
- Dropdown referensi dibatasi maksimum 20 produk atau 100 konfigurasi aktif.
- Import besar dikirim ke RPC dalam batch maksimum 100 row.
- Dashboard dan kartu ringkasan memakai RPC agregasi, bukan mengunduh seluruh row.

Mode lokal memakai kontrak pagination yang sama untuk UI, tetapi sumber penyimpanannya tetap `localStorage` karena tidak ada request jaringan.

## Deploy Vercel

1. Import repository ke Vercel.
2. Jalankan `supabase/schema.sql` pada database production.
3. Tambahkan dua environment Supabase di Project Settings.
4. Deploy.
5. Tambahkan domain Vercel ke **Supabase Authentication → URL Configuration**.

Project ini tidak memakai Shopee Open Platform API dan tidak membutuhkan static outbound IP.

## Pemeriksaan Kualitas

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
