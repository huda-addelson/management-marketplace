"use client";

import { create } from "zustand";

import { createInitialData } from "@/lib/seed-data";
import type { Product } from "@/types/domain";

type ProductState = {
  products: Product[];
  replaceProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (products: Product[]) => number;
  takeStock: (id: string, quantity: number) => number;
  restoreStock: (id: string, quantity: number) => void;
  resetProducts: () => void;
};

const touch = () => new Date().toISOString();
const initialProducts = () => createInitialData().products;

export const useProductStore = create<ProductState>()((set, get) => ({
  products: initialProducts(),
  replaceProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, ...updates, updatedAt: touch() } : product,
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({ products: state.products.filter((product) => product.id !== id) })),
  importProducts: (productsToImport) => {
    const existing = new Set(
      get().products.map((product) =>
        `${product.brand}|${product.size}|${product.name}`.toLocaleLowerCase(),
      ),
    );
    const unique = productsToImport.filter((product) => {
      const key = `${product.brand}|${product.size}|${product.name}`.toLocaleLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    set((state) => ({ products: [...state.products, ...unique] }));
    return unique.length;
  },
  takeStock: (id, quantity) => {
    const product = get().products.find((item) => item.id === id);
    const stockDelta = product ? Math.min(product.stock, Math.max(0, quantity)) : 0;
    if (stockDelta > 0) {
      set((state) => ({
        products: state.products.map((item) =>
          item.id === id
            ? { ...item, stock: item.stock - stockDelta, updatedAt: touch() }
            : item,
        ),
      }));
    }
    return stockDelta;
  },
  restoreStock: (id, quantity) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id
          ? { ...product, stock: product.stock + Math.max(0, quantity), updatedAt: touch() }
          : product,
      ),
    })),
  resetProducts: () => set({ products: initialProducts() }),
}));
