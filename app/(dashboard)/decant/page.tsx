import type { Metadata } from "next";

import { DecantsView } from "@/features/decants";

export const metadata: Metadata = { title: "Decant Lab" };

export default function DecantPage() {
  return <DecantsView />;
}
