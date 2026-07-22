import { describe, expect, it } from "vitest";

import { normalizePage, pageRange, paginateArray } from "./pagination";

describe("pagination", () => {
  it("uses an inclusive Supabase range", () => {
    expect(pageRange({ page: 3, pageSize: 20 })).toEqual({
      page: 3,
      pageSize: 20,
      from: 40,
      to: 59,
    });
  });

  it("clamps invalid and oversized requests", () => {
    expect(normalizePage({ page: -4, pageSize: 500 })).toEqual({
      page: 1,
      pageSize: 100,
    });
  });

  it("returns only the requested local page", () => {
    expect(paginateArray([1, 2, 3, 4, 5], { page: 2, pageSize: 2 })).toEqual({
      items: [3, 4],
      total: 5,
      page: 2,
      pageSize: 2,
    });
  });
});
