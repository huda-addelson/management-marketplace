"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { FeeListParams } from "../types/fee.type";
import { getActiveFees, getFeePage, getFeeSummary } from "./fee.service";

export const feeKeys = {
  all: ["fees"] as const,
  lists: () => [...feeKeys.all, "list"] as const,
  list: (params: FeeListParams) => [...feeKeys.lists(), params] as const,
  active: () => [...feeKeys.all, "active"] as const,
  summary: () => [...feeKeys.all, "summary"] as const,
};

export function useFeePage(params: FeeListParams) {
  return useQuery({
    queryKey: feeKeys.list(params),
    queryFn: ({ signal }) => getFeePage(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useActiveFees() {
  return useQuery({
    queryKey: feeKeys.active(),
    queryFn: ({ signal }) => getActiveFees(signal),
  });
}

export function useFeeSummary() {
  return useQuery({
    queryKey: feeKeys.summary(),
    queryFn: ({ signal }) => getFeeSummary(signal),
  });
}
