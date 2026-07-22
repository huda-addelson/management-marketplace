import type { Metadata } from "next";

import { ImportsView } from "@/features/imports";

export const metadata: Metadata = { title: "Impor Data" };

export default function ImportsPage() {
  return <ImportsView />;
}
