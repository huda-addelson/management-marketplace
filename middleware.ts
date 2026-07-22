import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { env, isSupabaseConfigured } from "@/env";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  });
  return target;
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  if (isApi || pathname === "/manifest.webmanifest") return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    if (pathname === ROUTES.login) return response;
  }

  if (!user && pathname !== ROUTES.login) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return copyResponseCookies(response, NextResponse.redirect(url));
  }
  if (user && pathname === ROUTES.login) {
    return copyResponseCookies(response, NextResponse.redirect(new URL(ROUTES.dashboard, request.url)));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
