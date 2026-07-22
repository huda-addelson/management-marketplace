"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { feeKeys } from "./fee.query";
import { archiveFee, createFee, updateFee } from "./fee.service";

export function useCreateFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
}

export function useUpdateFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
}

export function useArchiveFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveFee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
}
