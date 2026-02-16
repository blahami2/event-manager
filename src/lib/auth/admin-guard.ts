import { createAdminClient } from "@/lib/auth/supabase-client";
import { findAdminBySupabaseId } from "@/repositories/admin-repository";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";
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
 * 1. Extract the Bearer token from the Authorization header
 * 2. Verify the token with Supabase (`auth.getUser`)
 * 3. Check if the Supabase user ID exists in the AdminUser table
 *
 * @throws {AuthenticationError} if no valid session (401)
 * @throws {AuthorizationError} if session valid but user is not admin (403)
 */
export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthenticationError();
  }

  const token = authHeader.substring(7);

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  const admin = await findAdminBySupabaseId(data.user.id);

  if (!admin) {
    // Development helper: include Supabase ID in error for easier debugging
    const error = new AuthorizationError();
    error.message = `Insufficient permissions. Supabase user ID: ${data.user.id}`;
    throw error;
  }

  logger.info("Admin authenticated", { adminUserId: admin.id });

  return { authenticated: true, adminId: admin.id };
}
