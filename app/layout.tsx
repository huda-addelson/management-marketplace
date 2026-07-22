import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { AppProvider } from "@/providers";

import "./globals.css";

const jakartaSans = localFont({
  src: "./fonts/PlusJakartaSansVF.woff2",
  variable: "--font-sans-app",
  weight: "200 800",
});

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGroteskVF.woff2",
  variable: "--font-display-app",
  weight: "300 700",
});

export const metadata: Metadata = {
  title: {
    default: "Addelson Store - Margin Studio",
    template: "%s | Addelson Store",
  },
  description:
    "Dashboard modal, harga jual Shopee, potongan marketplace, dan keuntungan toko parfum.",
  icons: {
    icon: "/addelson-store.png",
    shortcut: "/addelson-store.png",
    apple: "/addelson-store.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f6f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakartaSans.variable} ${spaceGrotesk.variable} antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
