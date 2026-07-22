import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/env";

import { supabaseCookieOptions } from "./cookie-options";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createBrowserClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
      { cookieOptions: supabaseCookieOptions },
    );
  }

  return client;
}
