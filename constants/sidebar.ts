import {
  BarChart3,
  FileUp,
  FlaskConical,
  PackageOpen,
  ReceiptText,
  Settings2,
} from "lucide-react";

import { ROUTES } from "./routes";

export const SIDEBAR_ITEMS = [
  { href: ROUTES.dashboard, label: "Ringkasan", shortLabel: "Ringkasan", icon: BarChart3 },
  { href: ROUTES.products, label: "Produk & Harga", shortLabel: "Produk", icon: PackageOpen },
  { href: ROUTES.decant, label: "Decant Lab", shortLabel: "Decant", icon: FlaskConical },
  { href: ROUTES.sales, label: "Penjualan", shortLabel: "Penjualan", icon: ReceiptText },
  { href: ROUTES.imports, label: "Impor Data", shortLabel: "Impor", icon: FileUp },
  { href: ROUTES.settings, label: "Pengaturan", shortLabel: "Atur", icon: Settings2 },
] as const;
