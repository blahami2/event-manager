import { NextRequest } from "next/server";

import { registerGuest } from "@/lib/usecases/register";
import { createRateLimiter } from "@/lib/rate-limit/limiter";
import { successResponse, handleApiError } from "@/lib/api-response";
import { RateLimitError } from "@/lib/errors/app-errors";
import { logger, hashIp } from "@/lib/logger";

const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 5,
});

export async function POST(
  request: NextRequest,
): Promise<Response> {
  try {
    // Extract IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const hashedIp = hashIp(ip);

    // Rate limit check BEFORE use case
    const limit = rateLimiter.check(hashedIp);
    if (!limit.allowed) {
      const retryAfter = Math.ceil(
        (limit.resetAt.getTime() - Date.now()) / 1000,
      );
      logger.warn("Rate limit exceeded", { endpoint: "/api/register", ip: hashedIp });
      throw new RateLimitError(retryAfter);
    }

    // Parse body and delegate to use case
    const body: unknown = await request.json();
    const result = await registerGuest(body);

    return successResponse(
      { registrationId: result.registrationId },
      "Registration successful. Check your email.",
      201,
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
