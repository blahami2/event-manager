import { NextRequest } from "next/server";

import { updateRegistrationByToken, cancelRegistrationByToken } from "@/lib/usecases/manage-registration";
import { successResponse, handleApiError } from "@/lib/api-response";
import { createRateLimiter } from "@/lib/rate-limit/limiter";
import { logger, hashIp } from "@/lib/logger";
import { RateLimitError, ValidationError } from "@/lib/errors/app-errors";

/** Rate limiter: 10 attempts per IP per hour. */
const limiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 10,
});

/**
 * Extract client IP from request headers.
 */
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Apply rate limiting; throws RateLimitError if exceeded.
 */
function applyRateLimit(req: Request): void {
  const ip = getClientIp(req);
  const hashedIp = hashIp(ip);
  const result = limiter.check(hashedIp);
  if (!result.allowed) {
    const retryAfter = Math.ceil(
      (result.resetAt.getTime() - Date.now()) / 1000,
    );
    logger.warn("Rate limit exceeded", { endpoint: "/api/manage", ip: hashedIp });
    throw new RateLimitError(retryAfter);
  }
}

/**
 * Extract and validate that token exists in the parsed body.
 */
function extractToken(body: Record<string, unknown>): string {
  const token = body.token;
  if (typeof token !== "string" || token.length === 0) {
    throw new ValidationError("Validation failed", { token: "Token is required" });
  }
  return token;
}

/**
 * PUT /api/manage
 *
 * Update a registration via capability token.
 * Body: { token, name, email, guestCount, dietaryNotes? }
 */
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    applyRateLimit(req);

    const body = (await req.json()) as Record<string, unknown>;
    const token = extractToken(body);

    const { name, email, guestCount, dietaryNotes } = body;
    const result = await updateRegistrationByToken(token, {
      name,
      email,
      guestCount,
      dietaryNotes,
    });

    return successResponse({ newManageUrl: result.newManageUrl }, "Registration updated");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/manage
 *
 * Cancel a registration via capability token.
 * Body: { token }
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    applyRateLimit(req);

    const body = (await req.json()) as Record<string, unknown>;
    const token = extractToken(body);

    await cancelRegistrationByToken(token);

    return successResponse(null, "Registration cancelled");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
