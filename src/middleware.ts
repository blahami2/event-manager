import { type NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/lib/auth/middleware";

export function middleware(request: NextRequest): NextResponse {
  // Admin routes (except /admin/login) require auth
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login")
  ) {
    return adminMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
