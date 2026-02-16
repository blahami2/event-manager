import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware helper for admin routes.
 *
 * Checks if the request has an authorization cookie or header.
 * If not, redirects to /admin/login.
 *
 * NOTE: This is a lightweight check. Full admin verification
 * happens in the API route handlers via verifyAdmin().
 * The middleware only handles the redirect for unauthenticated
 * browser navigation.
 */
export function adminMiddleware(request: NextRequest): NextResponse {
  const hasAuthHeader = request.headers.has("authorization");
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
    );

  if (!hasAuthHeader && !hasAuthCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Route matcher for admin middleware.
 * Matches all /admin/* routes except /admin/login.
 */
export const adminMiddlewareConfig = {
  matcher: ["/admin/((?!login).*)"],
} as const;
