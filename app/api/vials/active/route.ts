import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, mapVial, type DatabaseRow } from "@/app/api/_lib/shopee";
import { REFERENCE_PAGE_SIZE } from "@/types/pagination";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("vial_costs")
      .select("*")
      .eq("active", true)
      .order("size_ml", { ascending: true })
      .order("id", { ascending: true })
      .limit(REFERENCE_PAGE_SIZE)
      .abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess((data ?? []).map((row) => mapVial(row as DatabaseRow)));
  } catch (error) {
    return apiError(error);
  }
}
