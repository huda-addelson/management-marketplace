import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { getPaginationRange, getSearchParams, paginationSchema } from "@/app/api/_lib/pagination";
import {
  assertDatabaseResult,
  decantRow,
  mapDecant,
  type DatabaseRow,
} from "@/app/api/_lib/shopee";
import { decantSchema } from "@/features/decants/schemas/decant.schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { page, pageSize } = paginationSchema.parse(getSearchParams(request));
    const { supabase } = await requireUser();
    const { from, to } = getPaginationRange(page, pageSize);
    const { data, error, count } = await supabase
      .from("decant_recipes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
      .abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess({
      items: (data ?? []).map((row) => mapDecant(row as DatabaseRow)),
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
    const input = decantSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.from("decant_recipes").insert(decantRow(input));
    assertDatabaseResult(error);
    return apiSuccess(null, 201);
  } catch (error) {
    return apiError(error);
  }
}
