import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { findAdminBySupabaseId } from "@/repositories/admin-repository";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-errors";
import { logger } from "@/lib/logger";

/**
 * Result returned on successful admin verification.
 */
interface VerifyAdminResult {
  readonly authenticated: true;
  readonly adminId: string;
}

/**
 * Get required Supabase environment variables.
 * Throws if not set (fail-fast).
 */
function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  return { url, anonKey };
}

/**
 * Verify that the request comes from an authenticated admin user.
 *
 * Two-phase verification per architecture rule S6:
 * 1. Extract the Bearer token from the Authorization header, OR
 *    extract the session from Supabase SSR cookies
 * 2. Verify the token/session with Supabase (`auth.getUser`)
 * 3. Check if the Supabase user ID exists in the AdminUser allowlist
 *
 * @throws {AuthenticationError} if no valid session (401)
 * @throws {AuthorizationError} if the authenticated user is not allowlisted (403)
 */
export async function verifyAdmin(request: NextRequest): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  // Try Bearer token first (for API clients)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { url, anonKey } = getSupabaseConfig();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    const admin = await resolveAdmin(data.user.id);
    logger.info("Admin authenticated via Bearer token", { adminUserId: admin.adminId });
    return admin;
  }

  // Fall back to cookie-based auth (browser sessions via @supabase/ssr)
  const cookies = request.cookies.getAll();

  if (cookies.length === 0) {
    throw new AuthenticationError();
  }

  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookies;
      },
      setAll() {
        // No-op: read-only in API route context
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    logger.error("verifyAdmin: Supabase auth failed via cookie", {
      error,
      hasUser: !!data.user,
      cookiesCount: cookies.length,
    });
    throw new AuthenticationError();
  }

  const admin = await resolveAdmin(data.user.id);
  logger.info("Admin authenticated via cookie session", { adminUserId: admin.adminId });
  return admin;
}

/**
 * Resolve an explicitly allowlisted admin user by Supabase ID.
 * Authentication alone never grants admin authorization (architecture rule S6).
 */
async function resolveAdmin(supabaseUserId: string): Promise<VerifyAdminResult> {
  const admin = await findAdminBySupabaseId(supabaseUserId);

  if (!admin) {
    logger.warn("Authenticated user denied admin access");
    throw new AuthorizationError();
  }

  return {
    authenticated: true,
    adminId: admin.id,
  };
}
