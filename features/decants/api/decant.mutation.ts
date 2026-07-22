"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { decantKeys, vialKeys } from "./decant.query";
import {
  createDecant,
  createVial,
  deleteDecant,
  deleteVial,
  updateDecant,
  updateVial,
} from "./decant.service";

export function useCreateDecant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDecant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: decantKeys.all }),
  });
}

export function useUpdateDecant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDecant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: decantKeys.all }),
  });
}

export function useDeleteDecant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDecant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: decantKeys.all }),
  });
}

function invalidateVials(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: vialKeys.all }),
    queryClient.invalidateQueries({ queryKey: decantKeys.all }),
  ]);
}

export function useCreateVial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVial,
    onSuccess: () => invalidateVials(queryClient),
  });
}

export function useUpdateVial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVial,
    onSuccess: () => invalidateVials(queryClient),
  });
}

export function useDeleteVial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVial,
    onSuccess: () => invalidateVials(queryClient),
  });
}
