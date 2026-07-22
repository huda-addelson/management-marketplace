"use client";

import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import { isSupabaseConfigured } from "@/env";
import { useLogoutMutation } from "@/features/auth/api/auth.mutation";
import { AuthServiceError, getCurrentUser } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/auth.store";

interface AuthContextValue {
  mode: "local" | "supabase";
  ready: boolean;
  user: User | null;
  signingOut: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const mode = isSupabaseConfigured ? "supabase" : "local";
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;
    const syncUser = async () => {
      const previousUserId = useAuthStore.getState().user?.id ?? null;
      try {
        const session = await getCurrentUser();
        if (!active) return;
        if (previousUserId && previousUserId !== session.user.id) queryClient.clear();
        setUser(session.user);
      } catch (error) {
        if (error instanceof AuthServiceError && error.code === "auth_unavailable") return;
        if (active) {
          if (previousUserId) queryClient.clear();
          reset();
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    const syncVisiblePage = () => {
      if (document.visibilityState === "visible") void syncUser();
    };

    void syncUser();
    window.addEventListener("focus", syncUser);
    document.addEventListener("visibilitychange", syncVisiblePage);
    return () => {
      active = false;
      window.removeEventListener("focus", syncUser);
      document.removeEventListener("visibilitychange", syncVisiblePage);
    };
  }, [queryClient, reset, setLoading, setUser]);

  const signOut = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sesi belum berhasil diakhiri.");
    }
  };

  return (
    <AuthContext.Provider value={{ mode, ready: !isLoading, user, signingOut: logoutMutation.isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext harus digunakan di dalam AuthProvider.");
  return context;
}
