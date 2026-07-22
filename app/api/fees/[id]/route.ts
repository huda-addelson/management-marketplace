import { z } from "zod";

import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";
import { assertDatabaseResult, feeRow } from "@/app/api/_lib/shopee";
import { feeUpdateSchema } from "@/features/fees/schemas/fee.schema";

const idSchema = z.string().min(1).max(200);
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const input = feeUpdateSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("fee_rules")
      .update(feeRow({ ...input, updatedAt: new Date().toISOString() }))
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
    const now = new Date().toISOString();
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("fee_rules")
      .update({ active: false, archived_at: now, updated_at: now })
      .eq("id", idSchema.parse(id));
    assertDatabaseResult(error);
    return apiSuccess(null);
  } catch (error) {
    return apiError(error);
  }
}
