import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult } from "@/app/api/_lib/shopee";

const idSchema = z.string().min(1).max(200);
type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("delete_sale", { p_sale_id: idSchema.parse(id) });
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
