import { apiError, apiSuccess, requireUser } from "@/app/api/_lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await requireUser();
    return apiSuccess({ user });
  } catch (error) {
    return apiError(error);
  }
}
