import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Addelson Store - Margin Studio",
    short_name: "Addelson",
    description: "Dashboard harga, potongan, penjualan, dan profit Shopee.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f3f6f4",
    theme_color: "#153f36",
    icons: [
      {
        src: "/addelson-store.png",
        sizes: "2048x2048",
        type: "image/png",
      },
    ],
  };
}
