"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/api/dashboard.query";

import { productKeys } from "./product.query";
import {
  createProduct,
  deleteProduct,
  findProductsForImport,
  importProducts,
  updateProduct,
} from "./product.service";

function invalidateProductData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => invalidateProductData(queryClient),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => invalidateProductData(queryClient),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => invalidateProductData(queryClient),
  });
}

export function useFindProductsForImport() {
  return useMutation({ mutationFn: findProductsForImport });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProducts,
    onSuccess: () => invalidateProductData(queryClient),
  });
}
