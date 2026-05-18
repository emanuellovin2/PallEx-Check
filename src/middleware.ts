import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public static assets and API routes — always pass through
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/workbox");

  if (isPublicAsset) return supabaseResponse;

  const isAuthPage = pathname.startsWith("/auth");
  const isRootPage = pathname === "/";

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    if (isAuthPage || isRootPage) return supabaseResponse;
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // ── Authenticated: bounce away from auth pages ───────────────────────────────
  if (isAuthPage || isRootPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Note: /admin/* role enforcement is done in the server layout
  // (src/app/(protected)/admin/layout.tsx) to avoid a DB call per-request.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|workbox-.+\\.js).*)",
  ],
};
