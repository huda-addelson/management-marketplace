import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export function getSearchParams(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export function getPaginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
