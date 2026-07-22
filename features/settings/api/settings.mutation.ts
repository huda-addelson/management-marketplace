"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { settingsKeys } from "./settings.query";
import { resetData, updateSettings } from "./settings.service";

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

export function useResetData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetData,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
