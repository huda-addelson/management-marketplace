import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { getPaginationRange, getSearchParams, paginationSchema } from "@/app/api/_lib/pagination";
import {
  assertDatabaseResult,
  feeRow,
  mapFee,
  type DatabaseRow,
} from "@/app/api/_lib/shopee";
import { feeSchema } from "@/features/fees/schemas/fee.schema";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({
  showArchived: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export async function GET(request: Request) {
  try {
    const { page, pageSize, showArchived } = listSchema.parse(getSearchParams(request));
    const { supabase } = await requireUser();
    const { from, to } = getPaginationRange(page, pageSize);
    let query = supabase
      .from("fee_rules")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (!showArchived) query = query.is("archived_at", null);
    const { data, error, count } = await query.range(from, to).abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess({
      items: (data ?? []).map((row) => mapFee(row as DatabaseRow)),
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = feeSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.from("fee_rules").insert(feeRow(input));
    assertDatabaseResult(error);
    return apiSuccess(null, 201);
  } catch (error) {
    return apiError(error);
  }
}
