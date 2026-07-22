import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabaseConfigured, env } from "@/env";

import { supabaseCookieOptions } from "./cookie-options";

export async function getSupabaseServerClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Middleware refreshes cookies when a Server Component cannot write them.
        }
      },
    },
  });
}
