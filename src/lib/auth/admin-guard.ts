import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { findAdminBySupabaseId, ensureAdminUser } from "@/repositories/admin-repository";
import { AuthenticationError } from "@/lib/errors/app-errors";
import { logger } from "@/lib/logger";

/**
 * Result returned on successful admin verification.
 */
interface VerifyAdminResult {
  readonly authenticated: true;
  readonly adminId: string;
}

/**
 * Verify that the request comes from an authenticated admin user.
 *
 * Two-phase verification per architecture rule S6:
 * 1. Extract the Bearer token from the Authorization header, OR
 *    extract the session from Supabase SSR cookies
 * 2. Verify the token/session with Supabase (`auth.getUser`)
 * 3. Check if the Supabase user ID exists in the AdminUser table;
 *    if not, auto-provision (only Supabase Auth users can reach this point)
 *
 * @throws {AuthenticationError} if no valid session (401)
 */
export async function verifyAdmin(request: NextRequest): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  // Try Bearer token first (for API clients)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    const admin = await resolveAdmin(data.user.id, data.user.email ?? "");
    logger.info("Admin authenticated via Bearer token", { adminUserId: admin.adminId });
    return admin;
  }

  // Fall back to cookie-based auth (browser sessions via @supabase/ssr)
  const cookies = request.cookies.getAll();

  if (cookies.length === 0) {
    throw new AuthenticationError();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll() {
          // No-op: read-only in API route context
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  const admin = await resolveAdmin(data.user.id, data.user.email ?? "");
  logger.info("Admin authenticated via cookie session", { adminUserId: admin.adminId });
  return admin;
}

/**
 * Resolve or auto-provision an admin user by Supabase ID.
 *
 * Looks up the AdminUser record; if not found, creates one.
 * This handles the case where the database was seeded with a placeholder
 * Supabase user ID that doesn't match the real one (fixes B-005/B-006).
 */
async function resolveAdmin(
  supabaseUserId: string,
  email: string,
): Promise<VerifyAdminResult> {
  let admin = await findAdminBySupabaseId(supabaseUserId);

  if (!admin) {
    logger.info("Auto-provisioning admin user", { supabaseUserId, email });
    admin = await ensureAdminUser(supabaseUserId, email);
  }

  return {
    authenticated: true,
    adminId: admin.id,
  };
}
