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
 * Prefix used by @supabase/ssr v0.8+ when cookieEncoding is "base64url" (the default).
 * Cookie values are stored as "base64-" + base64url(sessionJSON).
 */
const BASE64_PREFIX = "base64-";

/**
 * Extract access token from Supabase auth cookies.
 *
 * @supabase/ssr stores the session in cookies named `sb-<ref>-auth-token`.
 * The value may be chunked across multiple cookies (`.0`, `.1`, etc.).
 *
 * With @supabase/ssr v0.8+ (default cookieEncoding "base64url"), the value
 * is prefixed with "base64-" followed by the base64url-encoded session JSON
 * which contains `access_token`, `refresh_token`, etc.
 *
 * Returns the access token string or null if not found.
 */
export function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  // Parse cookies into a map
  const cookies = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const name = part.substring(0, eqIdx).trim();
    const value = part.substring(eqIdx + 1).trim();
    cookies.set(name, value);
  }

  // Find the base cookie name (sb-<ref>-auth-token)
  let baseName: string | null = null;
  for (const name of cookies.keys()) {
    if (name.startsWith("sb-") && name.includes("-auth-token")) {
      // Could be "sb-xxx-auth-token" or "sb-xxx-auth-token.0"
      baseName = name.replace(/\.\d+$/, "");
      break;
    }
  }

  if (!baseName) return null;

  // Reassemble potentially chunked cookie value
  let value = cookies.get(baseName);
  if (value === undefined) {
    // Chunked cookies: sb-xxx-auth-token.0, .1, .2, ...
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = cookies.get(`${baseName}.${i}`);
      if (chunk === undefined) break;
      chunks.push(chunk);
    }
    if (chunks.length === 0) return null;
    value = chunks.join("");
  }

  try {
    let sessionJson: string;

    if (value.startsWith(BASE64_PREFIX)) {
      // @supabase/ssr v0.8+ base64url encoding (default)
      const b64 = value.substring(BASE64_PREFIX.length);
      // base64url → standard base64
      const std = b64.replace(/-/g, "+").replace(/_/g, "/");
      sessionJson = atob(std);
    } else {
      // Older format: try base64 decode, then URI decode
      try {
        const std = value.replace(/-/g, "+").replace(/_/g, "/");
        sessionJson = atob(std);
      } catch {
        sessionJson = decodeURIComponent(value);
      }
    }

    const parsed: unknown = JSON.parse(sessionJson);

    // Array format: [access_token, refresh_token, ...]
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return parsed[0];
    }
    // Object format: { access_token: "...", ... }
    if (parsed && typeof parsed === "object" && "access_token" in parsed) {
      return (parsed as { access_token: string }).access_token;
    }
  } catch {
    // Not JSON — might be the raw token itself (JWT = three dot-separated base64 segments)
    if (value.split(".").length === 3) {
      return value;
    }
  }

  return null;
}

/**
 * Verify that the request comes from an authenticated admin user.
 *
 * Two-phase verification per architecture rule S6:
 * 1. Extract the Bearer token from the Authorization header, OR
 *    extract the access token from Supabase auth cookies
 * 2. Verify the token with Supabase (`auth.getUser`)
 * 3. Check if the Supabase user ID exists in the AdminUser table
 *
 * @throws {AuthenticationError} if no valid session (401)
 * @throws {AuthorizationError} if session valid but user is not admin (403)
 */
export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fall back to Supabase auth cookies (set by @supabase/ssr browser client)
    token = extractTokenFromCookies(request.headers.get("cookie"));
  }

  if (!token) {
    throw new AuthenticationError();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError();
  }

  const admin = await findAdminBySupabaseId(data.user.id);

  if (!admin) {
    throw new AuthorizationError();
  }

  logger.info("Admin authenticated", { adminUserId: admin.id });

  return { authenticated: true, adminId: admin.id };
}
