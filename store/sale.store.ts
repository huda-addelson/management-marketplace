"use client";

import { create } from "zustand";

import { useProductStore } from "@/store/product.store";
import type { Sale } from "@/types/domain";

type SaleState = {
  sales: Sale[];
  replaceSales: (sales: Sale[]) => void;
  addSale: (sale: Sale, adjustStock?: boolean) => void;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  importSales: (sales: Sale[], adjustStock?: boolean) => number;
  clearProductReference: (productId: string) => void;
  resetSales: () => void;
};

const touch = () => new Date().toISOString();

export const useSaleStore = create<SaleState>()((set, get) => ({
  sales: [],
  replaceSales: (sales) => set({ sales }),
  addSale: (sale, adjustStock = true) => {
    const stockDelta = adjustStock && sale.productId
      ? useProductStore.getState().takeStock(sale.productId, sale.quantity)
      : 0;
    set((state) => ({
      sales: [{ ...sale, stockAdjusted: stockDelta > 0, stockDelta }, ...state.sales],
    }));
  },
  deleteSale: (id, restoreStock = false) => {
    const sale = get().sales.find((item) => item.id === id);
    if (restoreStock && sale?.productId) {
      useProductStore.getState().restoreStock(
        sale.productId,
        sale.stockDelta ?? sale.quantity,
      );
    }
    set((state) => ({ sales: state.sales.filter((item) => item.id !== id) }));
  },
  importSales: (salesToImport, adjustStock = false) => {
    const existing = new Set(
      get().sales.map((sale) => `${sale.orderNumber}|${sale.sku}|${sale.productName}`),
    );
    const unique = salesToImport.filter((sale) => {
      const key = `${sale.orderNumber}|${sale.sku}|${sale.productName}`;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    const normalized = unique.map((sale) => {
      const stockDelta = adjustStock && sale.productId
        ? useProductStore.getState().takeStock(sale.productId, sale.quantity)
        : 0;
      return { ...sale, stockAdjusted: stockDelta > 0, stockDelta };
    });
    set((state) => ({ sales: [...normalized, ...state.sales] }));
    return normalized.length;
  },
  clearProductReference: (productId) =>
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.productId === productId
          ? { ...sale, productId: null, updatedAt: touch() }
          : sale,
      ),
    })),
  resetSales: () => set({ sales: [] }),
}));
