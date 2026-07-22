import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, vialRow } from "@/app/api/_lib/shopee";
import { vialUpdateSchema } from "@/features/decants/schemas/decant.schema";

const idSchema = z.string().min(1).max(200);
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const input = vialUpdateSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("vial_costs")
      .update(vialRow({ ...input, updatedAt: new Date().toISOString() }))
      .eq("id", idSchema.parse(id));
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("delete_vial_cost", { p_vial_id: idSchema.parse(id) });
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
