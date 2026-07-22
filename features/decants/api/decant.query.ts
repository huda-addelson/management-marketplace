"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { PageRequest } from "@/types/pagination";

import { getActiveVials, getDecantPage, getVialPage } from "./decant.service";

export const decantKeys = {
  all: ["decants"] as const,
  lists: () => [...decantKeys.all, "list"] as const,
  list: (params: PageRequest) => [...decantKeys.lists(), params] as const,
};

export const vialKeys = {
  all: ["vials"] as const,
  lists: () => [...vialKeys.all, "list"] as const,
  list: (params: PageRequest) => [...vialKeys.lists(), params] as const,
  active: () => [...vialKeys.all, "active"] as const,
};

export function useDecantPage(params: PageRequest) {
  return useQuery({
    queryKey: decantKeys.list(params),
    queryFn: ({ signal }) => getDecantPage(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useVialPage(params: PageRequest) {
  return useQuery({
    queryKey: vialKeys.list(params),
    queryFn: ({ signal }) => getVialPage(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useActiveVials() {
  return useQuery({
    queryKey: vialKeys.active(),
    queryFn: ({ signal }) => getActiveVials(signal),
  });
}
