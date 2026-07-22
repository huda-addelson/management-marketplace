import { ApiRouteError, apiError, apiSuccess } from "@/app/api/_lib/http";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error && error.name !== "AuthSessionMissingError") {
      throw new ApiRouteError(error.message, error.status ?? 400, error.code);
    }
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
