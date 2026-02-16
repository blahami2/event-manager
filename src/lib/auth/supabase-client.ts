import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side use with the anon key.
 *
 * Uses @supabase/ssr's createBrowserClient which stores auth tokens
 * in **cookies** (not localStorage). This is critical because the
 * Next.js middleware reads cookies to check authentication.
 *
 * Without this, signInWithPassword succeeds but the session is only
 * in localStorage, so the middleware never sees it and redirects
 * back to /admin/login on every navigation.
 */
let browserClientInstance: SupabaseClient | undefined;

export function createBrowserClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  browserClientInstance = createSSRBrowserClient(url, anonKey);
  return browserClientInstance;
}

/**
 * Resets the browser client singleton. Only for use in tests.
 * @internal
 */
export function resetBrowserClient(): void {
  browserClientInstance = undefined;
}

/**
 * Creates a Supabase client for server-side use with the anon key.
 *
 * Suitable for operations on behalf of the current user
 * (e.g. verifying sessions, reading public data).
 *
 * Environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous/public key
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase admin client using the service role key.
 *
 * This client bypasses Row Level Security and should ONLY be used
 * for trusted server-side admin operations (e.g. verifying admin users).
 *
 * Environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY     — Supabase service role secret key
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
