import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult } from "@/app/api/_lib/shopee";
import { settingsUpdateSchema } from "@/features/settings/schemas/settings.schema";
import type { AppSettings } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("workspace_profiles")
      .select("settings")
      .abortSignal(request.signal)
      .single();
    assertDatabaseResult(error);
    return apiSuccess((data?.settings ?? {}) as unknown as AppSettings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const settings = settingsUpdateSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("update_workspace_settings", { p_settings: settings });
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
