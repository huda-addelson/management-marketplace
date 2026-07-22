"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { ProductListParams } from "../types/product.type";
import { getProductBrands, getProductOptions, getProductPage, getProductSummary } from "./product.service";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  summary: () => [...productKeys.all, "summary"] as const,
  brands: () => [...productKeys.all, "brands"] as const,
  options: (search: string) => [...productKeys.all, "options", { search }] as const,
};

export function useProductPage(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => getProductPage(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProductSummary() {
  return useQuery({
    queryKey: productKeys.summary(),
    queryFn: ({ signal }) => getProductSummary(signal),
  });
}

export function useProductBrands() {
  return useQuery({
    queryKey: productKeys.brands(),
    queryFn: ({ signal }) => getProductBrands(signal),
  });
}

export function useProductOptions(search: string) {
  return useQuery({
    queryKey: productKeys.options(search),
    queryFn: ({ signal }) => getProductOptions(search, signal),
  });
}
