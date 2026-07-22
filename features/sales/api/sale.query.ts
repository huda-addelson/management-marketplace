"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { SaleListParams } from "../types/sale.type";
import { getSalePage, getSaleSummary } from "./sale.service";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: SaleListParams) => [...saleKeys.lists(), params] as const,
  summary: () => [...saleKeys.all, "summary"] as const,
};

export function useSalePage(params: SaleListParams) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: ({ signal }) => getSalePage(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSaleSummary() {
  return useQuery({
    queryKey: saleKeys.summary(),
    queryFn: ({ signal }) => getSaleSummary(signal),
  });
}
