"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/api/dashboard.query";
import { productKeys } from "@/features/products/api/product.query";

import { saleKeys } from "./sale.query";
import { createSale, deleteSale, importSales } from "./sale.service";

function invalidateSaleData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: saleKeys.all }),
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => invalidateSaleData(queryClient),
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => invalidateSaleData(queryClient),
  });
}

export function useImportSales() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importSales,
    onSuccess: () => invalidateSaleData(queryClient),
  });
}
