import { type NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/lib/auth/middleware";
import { LOCALE_COOKIE, detectLocale } from "@/i18n/get-locale";

export function middleware(request: NextRequest): NextResponse {
  // Admin routes (except /admin/login) require auth
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login")
  ) {
    return adminMiddleware(request);
  }

  // Set locale cookie if not already set
  const response = NextResponse.next();
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  const locale = detectLocale({
    cookieLocale: existingLocale,
    acceptLanguage: request.headers.get("accept-language") ?? undefined,
  });

  if (!existingLocale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next|.*\\..*).*)"],
};
