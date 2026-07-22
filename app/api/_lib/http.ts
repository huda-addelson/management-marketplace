import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiError, ApiResponse } from "@/types/api";

const noStoreHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

export class ApiRouteError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status, headers: noStoreHeaders });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json<ApiError>(
      { message: error.issues[0]?.message ?? "Data tidak valid.", code: "validation_error" },
      { status: 400, headers: noStoreHeaders },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json<ApiError>(
      { message: "Format JSON tidak valid.", code: "invalid_json" },
      { status: 400, headers: noStoreHeaders },
    );
  }
  if (error instanceof ApiRouteError) {
    return NextResponse.json<ApiError>(
      { message: error.message, code: error.code },
      { status: error.status, headers: noStoreHeaders },
    );
  }
  console.error("Unhandled API error", error);
  return NextResponse.json<ApiError>(
    { message: error instanceof Error ? error.message : "Terjadi kesalahan pada server.", code: "internal_server_error" },
    { status: 500, headers: noStoreHeaders },
  );
}

export async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiRouteError("Sesi Anda telah berakhir. Silakan masuk kembali.", 401, "unauthorized");
  }
  return { supabase, user: data.user };
}
