import { NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/auth/supabase-client";
import { createRateLimiter } from "@/lib/rate-limit/limiter";
import { successResponse, handleApiError } from "@/lib/api-response";
import { RateLimitError, ValidationError } from "@/lib/errors/app-errors";
import { logger, hashIp } from "@/lib/logger";

/**
 * Rate limiter: 5 attempts per IP per 15 minutes.
 * Module-level singleton so state persists across requests.
 */
const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/admin/login
 *
 * Authenticates an admin user via Supabase and returns the session token.
 * Rate limited to 5 attempts per IP per 15 minutes (S7).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Extract IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const hashedIp = hashIp(ip);

    // Rate limit check BEFORE any processing
    const limitResult = rateLimiter.check(hashedIp);
    if (!limitResult.allowed) {
      const retryAfter = Math.ceil(
        (limitResult.resetAt.getTime() - Date.now()) / 1000,
      );
      logger.warn("Rate limit exceeded", { endpoint: "/api/admin/login", ip: hashedIp });
      throw new RateLimitError(retryAfter);
    }

    // Parse and validate body
    const rawBody: unknown = await request.json();
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "field";
        fields[key] = issue.message;
      }
      throw new ValidationError("Invalid input", fields);
    }

    // Authenticate via Supabase
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session) {
      // Return generic error to prevent user enumeration
      return successResponse(null, "Invalid credentials", 401);
    }

    logger.info("Admin login successful", { email: parsed.data.email });

    return successResponse(
      { accessToken: data.session.access_token },
      "Login successful",
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
