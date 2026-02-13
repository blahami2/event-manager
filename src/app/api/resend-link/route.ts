import { NextResponse } from "next/server";
import { z } from "zod";

import { resendManageLink } from "@/lib/usecases/resend-link";
import { successResponse, handleApiError } from "@/lib/api-response";
import { createRateLimiter } from "@/lib/rate-limit/limiter";
import { RateLimitError, ValidationError } from "@/lib/errors/app-errors";
import { logger, hashIp } from "@/lib/logger";

/**
 * Rate limiter: 3 attempts per IP per hour.
 * Module-level singleton so state persists across requests.
 */
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
});

const resendLinkSchema = z.object({
  email: z.string().email(),
});

/**
 * Minimum response time in ms to normalize timing and prevent
 * timing-based email enumeration (S5).
 */
const MIN_RESPONSE_MS = 150;

/**
 * POST /api/resend-link
 *
 * Accepts { email: string } and always returns an identical 200 response
 * regardless of whether the email exists. This prevents email enumeration
 * attacks (architecture rule S5).
 *
 * Rate limited to 3 attempts per IP per hour (S7).
 */
export async function POST(
  request: Request,
): Promise<NextResponse> {
  const startTime = Date.now();

  // Extract IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const hashedIp = hashIp(ip);

  // Rate limit check (before any processing)
  const limitResult = rateLimiter.check(hashedIp);
  if (!limitResult.allowed) {
    const retryAfter = Math.ceil(
      (limitResult.resetAt.getTime() - Date.now()) / 1000,
    );
    logger.warn("Rate limit exceeded", { endpoint: "/api/resend-link", ip: hashedIp });
    return handleApiError(new RateLimitError(retryAfter));
  }

  // Parse and validate body
  let parsed: z.infer<typeof resendLinkSchema>;
  try {
    const body: unknown = await request.json();
    parsed = resendLinkSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "email";
        fields[key] = issue.message;
      }
      return handleApiError(new ValidationError("Invalid input", fields));
    }
    return handleApiError(new ValidationError("Invalid request body", { body: "Invalid JSON" }));
  }

  // Execute use case — catch errors silently to prevent info leakage (S5)
  try {
    await resendManageLink(parsed.email);
  } catch (error) {
    // Log but do NOT change the response — prevents info leakage
    logger.error("resend-link use case failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  // Normalize response timing (S5 timing-safe)
  const elapsed = Date.now() - startTime;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }

  return successResponse(
    { sent: true },
    "If this email is registered, a manage link has been sent.",
  );
}
