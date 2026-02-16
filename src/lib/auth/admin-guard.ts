import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { findAdminBySupabaseId } from "@/repositories/admin-repository";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";

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
 * 3. Check if the Supabase user ID exists in the AdminUser table
 *
 * @throws {AuthenticationError} if no valid session (401)
 * @throws {AuthorizationError} if session valid but user is not admin (403)
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
      }
    );
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    const admin = await findAdminBySupabaseId(data.user.id);

    if (!admin) {
      throw new AuthorizationError();
    }

    return {
      authenticated: true,
      adminId: admin.id,
    };
  }

  // Use NextRequest's .cookies API (same as middleware)
  const cookies = request.cookies.getAll();
  
  if (cookies.length === 0) {
    throw new AuthenticationError();
  }

  // Create Supabase client with NextRequest cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll() {
          // No-op: read-only
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  const admin = await findAdminBySupabaseId(data.user.id);

  if (!admin) {
    throw new AuthorizationError();
  }

  return {
    authenticated: true,
    adminId: admin.id,
  };
}
