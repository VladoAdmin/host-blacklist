import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Paths that require authentication (without locale prefix)
const PROTECTED_PATHS = ["/dashboard", "/search", "/report", "/settings"];
// Auth pages - redirect to dashboard if already logged in
const AUTH_PATHS = ["/login", "/register"];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // Step 1: Run intl middleware first to handle locale detection/redirect
  const intlResponse = intlMiddleware(request);

  // If intl middleware wants to redirect (e.g., / → /sk), let it
  if (intlResponse.headers.get("x-middleware-rewrite") === undefined && 
      intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Step 2: Auth check
  // Determine the actual pathname without locale prefix
  const pathname = stripLocale(request.nextUrl.pathname);
  const locale = getLocaleFromPath(request.nextUrl.pathname);

  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthRoute = AUTH_PATHS.some((path) => pathname === path);

  // Only run auth check for protected or auth routes
  if (!isProtectedRoute && !isAuthRoute) {
    return intlResponse;
  }

  // Create Supabase client for auth check
  let supabaseResponse = intlResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - IMPORTANT
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected route: redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Auth route: redirect to dashboard if already authenticated
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Transfer any cookies set by Supabase to the intl response
  if (supabaseResponse !== intlResponse) {
    supabaseResponse.headers.forEach((value, key) => {
      intlResponse.headers.set(key, value);
    });
    // Copy cookies from supabase response
    const setCookieHeader = supabaseResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      intlResponse.headers.set("set-cookie", setCookieHeader);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - api routes (they don't need locale)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|txt)$).*)",
  ],
};
