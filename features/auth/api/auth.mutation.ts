"use client";

import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth.store";

import { login, logout } from "./auth.service";

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => useAuthStore.getState().setUser(user),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => useAuthStore.getState().reset(),
  });
}
