import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, isLoading: false }),
}));
