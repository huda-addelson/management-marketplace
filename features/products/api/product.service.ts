import { API_ENDPOINTS } from "@/constants";
import { isSupabaseConfigured } from "@/env";
import { apiRequest } from "@/lib/api-client";
import { paginateArray } from "@/lib/pagination";
import { useProductStore } from "@/store/product.store";
import { useSaleStore } from "@/store/sale.store";
import type { Product } from "@/types/domain";
import type { PageResult } from "@/types/pagination";

import { productSchema, productUpdateSchema } from "../schemas/product.schema";
import type { ProductListParams, ProductSummary } from "../types/product.type";

const REFERENCE_LIMIT = 100;

function newestFirst(left: Product, right: Product) {
  return right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id);
}

function matches(product: Product, search = "") {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return true;
  return [product.name, product.brand, product.size, product.sku]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

function pageParams(params: ProductListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) search.set("search", params.search);
  if (params.brand && params.brand !== "all") search.set("brand", params.brand);
  return search;
}

export async function getProductPage(
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<PageResult<Product>> {
  if (isSupabaseConfigured) {
    return apiRequest(`${API_ENDPOINTS.products.root}?${pageParams(params)}`, { signal });
  }
  const products = useProductStore
    .getState()
    .products.filter(
      (product) =>
        matches(product, params.search) &&
        (!params.brand || params.brand === "all" || product.brand === params.brand),
    )
    .sort(newestFirst);
  return paginateArray(products, params);
}

export async function getProductBrands(signal?: AbortSignal): Promise<string[]> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.products.brands, { signal });
  return Array.from(new Set(useProductStore.getState().products.map((product) => product.brand)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, REFERENCE_LIMIT);
}

export async function getProductOptions(search = "", signal?: AbortSignal): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const query = params.size ? `?${params}` : "";
    return apiRequest(`${API_ENDPOINTS.products.options}${query}`, { signal });
  }
  return useProductStore.getState().products.filter((product) => matches(product, search)).sort(newestFirst).slice(0, 20);
}

export async function getProductSummary(signal?: AbortSignal): Promise<ProductSummary> {
  if (isSupabaseConfigured) return apiRequest(API_ENDPOINTS.products.summary, { signal });
  const products = useProductStore.getState().products;
  return {
    total: products.length,
    totalCapital: products.reduce((sum, product) => sum + product.capitalCost, 0),
    totalTarget: products.reduce((sum, product) => sum + product.targetProfit, 0),
    totalStock: products.reduce((sum, product) => sum + product.stock, 0),
    inventoryCapital: products.reduce((sum, product) => sum + product.capitalCost * product.stock, 0),
  };
}

export async function findProductsForImport({ skus, names }: { skus: string[]; names: string[] }) {
  if (isSupabaseConfigured) {
    const products = new Map<string, Product>();
    const chunkSize = 50;
    const rounds = Math.max(Math.ceil(skus.length / chunkSize), Math.ceil(names.length / chunkSize), 1);
    for (let index = 0; index < rounds; index += 1) {
      const matches = await apiRequest<Product[]>(API_ENDPOINTS.products.matches, {
        method: "POST",
        body: JSON.stringify({
          skus: skus.slice(index * chunkSize, (index + 1) * chunkSize),
          names: names.slice(index * chunkSize, (index + 1) * chunkSize),
        }),
      });
      matches.forEach((product) => products.set(product.id, product));
    }
    return Array.from(products.values());
  }
  const skuSet = new Set(skus.filter(Boolean).map((value) => value.toLocaleLowerCase()));
  const nameSet = new Set(names.filter(Boolean).map((value) => value.toLocaleLowerCase()));
  return useProductStore.getState().products.filter(
    (product) =>
      (product.sku && skuSet.has(product.sku.toLocaleLowerCase())) ||
      nameSet.has(product.name.toLocaleLowerCase()),
  );
}

export async function createProduct(input: Product) {
  const product = productSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.products.root, {
      method: "POST",
      body: JSON.stringify(product),
    });
  }
  useProductStore.getState().addProduct(product);
  return null;
}

export async function updateProduct({ id, input }: { id: string; input: Partial<Product> }) {
  const updates = productUpdateSchema.parse(input);
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.products.detail(id), {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
  useProductStore.getState().updateProduct(id, updates);
  return null;
}

export async function deleteProduct(id: string) {
  if (isSupabaseConfigured) {
    return apiRequest<null>(API_ENDPOINTS.products.detail(id), { method: "DELETE" });
  }
  useProductStore.getState().deleteProduct(id);
  useSaleStore.getState().clearProductReference(id);
  return null;
}

export async function importProducts(input: Product[]) {
  const products = productSchema.array().parse(input);
  if (!isSupabaseConfigured) return useProductStore.getState().importProducts(products);

  let imported = 0;
  for (let index = 0; index < products.length; index += 100) {
    imported += await apiRequest<number>(API_ENDPOINTS.products.import, {
      method: "POST",
      body: JSON.stringify(products.slice(index, index + 100)),
    });
  }
  return imported;
}
