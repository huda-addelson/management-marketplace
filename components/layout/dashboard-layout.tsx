"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { DataProvider } from "@/providers/data-provider";
import { useSidebarStore } from "@/store/sidebar.store";

import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  return (
    <DataProvider>
      <div className="min-h-screen bg-[var(--canvas)] pb-24 lg:pb-0">
        <Sidebar />
        <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-[92px]" : "lg:pl-[284px]")}>
          <Navbar />
          <main className="relative mx-auto w-full max-w-[1540px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
