import type { Metadata } from "next";

import { ProductsView } from "@/features/products";

export const metadata: Metadata = { title: "Produk & Harga" };

export default function ProductsPage() {
  return <ProductsView />;
}
