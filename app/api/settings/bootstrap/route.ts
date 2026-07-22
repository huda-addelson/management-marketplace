import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult } from "@/app/api/_lib/shopee";
import { initialDataSchema } from "@/features/settings/schemas/settings.schema";

export async function POST(request: Request) {
  try {
    const seed = initialDataSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("bootstrap_workspace", { p_seed: seed });
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
