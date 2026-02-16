import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  // Try Bearer token first (for API clients)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    // Use @supabase/ssr with empty cookies since we have a Bearer token
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

  // Fall back to cookie-based authentication (for browser requests)
  const cookieHeader = request.headers.get("cookie");
  
  if (!cookieHeader) {
    throw new AuthenticationError();
  }

  // Parse Cookie header into individual cookies
  const cookies = cookieHeader.split(";").map((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    return { name, value: valueParts.join("=") };
  });

  // Create Supabase client with parsed cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(cookiesToSet) {
          // No-op: we're only reading auth state, not modifying it
        },
      },
    }
  );

  // Let @supabase/ssr handle cookie parsing and session extraction
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
