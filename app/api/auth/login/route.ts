import { ApiRouteError, apiError, apiSuccess } from "@/app/api/_lib/http";
import { loginSchema } from "@/features/auth/schemas/auth.schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error) {
      if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
        throw new ApiRouteError("Email atau password tidak sesuai.", 400, "invalid_credentials");
      }
      throw new ApiRouteError(error.message, error.status ?? 400, error.code);
    }
    if (!data.user || !data.session) {
      throw new ApiRouteError("Sesi tidak dapat dibuat. Silakan coba kembali.", 401, "invalid_session");
    }
    return apiSuccess({ user: data.user });
  } catch (error) {
    return apiError(error);
  }
}
