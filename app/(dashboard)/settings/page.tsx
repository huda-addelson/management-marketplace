import type { Metadata } from "next";

import { SettingsView } from "@/features/settings";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return <SettingsView />;
}
