"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { QueryActivity } from "@/components/common/query-activity";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryProvider>
        <QueryActivity />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors closeButton position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
