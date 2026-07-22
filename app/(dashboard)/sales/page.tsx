import type { Metadata } from "next";

import { SalesView } from "@/features/sales";

export const metadata: Metadata = { title: "Penjualan" };

export default function SalesPage() {
  return <SalesView />;
}
