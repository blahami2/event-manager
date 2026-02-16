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

  console.log("[verifyAdmin] Starting verification");
  console.log("[verifyAdmin] Has auth header:", !!authHeader);
  console.log("[verifyAdmin] All cookies:", request.cookies.getAll().map(c => ({ name: c.name, valueLength: c.value.length })));

  // Try Bearer token first (for API clients)
  if (authHeader?.startsWith("Bearer ")) {
    console.log("[verifyAdmin] Using Bearer token");
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

    console.log("[verifyAdmin] Bearer auth result:", { hasUser: !!data.user, error: error?.message });

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

  console.log("[verifyAdmin] Trying cookie-based auth");

  // Use NextRequest's .cookies API (same as middleware)
  const cookies = request.cookies.getAll();
  
  console.log("[verifyAdmin] Cookie count:", cookies.length);

  if (cookies.length === 0) {
    console.log("[verifyAdmin] No cookies found - throwing AuthenticationError");
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

  console.log("[verifyAdmin] Created Supabase client, calling getUser()");

  const { data, error } = await supabase.auth.getUser();

  console.log("[verifyAdmin] Cookie auth result:", { 
    hasUser: !!data.user, 
    userId: data.user?.id,
    error: error?.message 
  });

  if (error || !data.user) {
    console.log("[verifyAdmin] Auth failed - throwing AuthenticationError");
    throw new AuthenticationError();
  }

  console.log("[verifyAdmin] Checking if user is admin:", data.user.id);

  const admin = await findAdminBySupabaseId(data.user.id);

  console.log("[verifyAdmin] Admin lookup result:", { found: !!admin, adminId: admin?.id });

  if (!admin) {
    console.log("[verifyAdmin] User not in AdminUser table - throwing AuthorizationError");
    throw new AuthorizationError();
  }

  console.log("[verifyAdmin] Success!");

  return {
    authenticated: true,
    adminId: admin.id,
  };
}
