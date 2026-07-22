import type { PageRequest, PageResult } from "@/types/pagination";

export const MAX_PAGE_SIZE = 100;

export function normalizePage(request: PageRequest) {
  return {
    page: Math.max(1, Math.trunc(request.page || 1)),
    pageSize: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(request.pageSize || 10)),
    ),
  };
}

export function pageRange(request: PageRequest) {
  const { page, pageSize } = normalizePage(request);
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function paginateArray<T>(items: T[], request: PageRequest): PageResult<T> {
  const { page, pageSize, from } = pageRange(request);
  return {
    items: items.slice(from, from + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
