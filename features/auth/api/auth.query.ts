"use client";

import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/env";

import { getCurrentUser } from "./auth.service";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    enabled: isSupabaseConfigured,
  });
}
