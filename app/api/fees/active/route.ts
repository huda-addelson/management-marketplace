import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, mapFee, type DatabaseRow } from "@/app/api/_lib/shopee";
import { REFERENCE_PAGE_SIZE } from "@/types/pagination";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("fee_rules")
      .select("*")
      .eq("active", true)
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(REFERENCE_PAGE_SIZE)
      .abortSignal(request.signal);
    assertDatabaseResult(error);
    return apiSuccess((data ?? []).map((row) => mapFee(row as DatabaseRow)));
  } catch (error) {
    return apiError(error);
  }
}
