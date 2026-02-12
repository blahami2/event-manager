/**
 * In-memory sliding-window rate limiter.
 *
 * Tracks attempts per identifier (typically a hashed IP) within a
 * configurable time window. Upgradeable to Redis/DB later.
 *
 * Use `hashIp()` from `src/lib/logger.ts` to hash IPs before passing
 * them as identifiers.
 *
 * See docs/ARCHITECTURE.md Section 9 for rate-limit specification.
 */

interface RateLimiterConfig {
  /** Window duration in milliseconds. */
  readonly windowMs: number;
  /** Maximum attempts allowed within the window. */
  readonly maxAttempts: number;
}

interface CheckResult {
  /** Whether the request is allowed. */
  readonly allowed: boolean;
  /** Number of attempts remaining in the current window. */
  readonly remaining: number;
  /** When the current window resets. */
  readonly resetAt: Date;
}

interface WindowEntry {
  count: number;
  windowStart: number;
}

interface RateLimiter {
  /** Check whether an identifier is within the rate limit. Increments the counter. */
  check(identifier: string): CheckResult;
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { windowMs, maxAttempts } = config;
  const entries = new Map<string, WindowEntry>();

  return {
    check(identifier: string): CheckResult {
      // Bypass when disabled in development
      if (process.env.RATE_LIMIT_DISABLED === "true") {
        return {
          allowed: true,
          remaining: maxAttempts,
          resetAt: new Date(Date.now() + windowMs),
        };
      }

      const now = Date.now();
      const entry = entries.get(identifier);

      // No existing entry or window expired → start fresh
      if (!entry || now - entry.windowStart >= windowMs) {
        entries.set(identifier, { count: 1, windowStart: now });
        return {
          allowed: true,
          remaining: maxAttempts - 1,
          resetAt: new Date(now + windowMs),
        };
      }

      // Within window
      entry.count += 1;
      const resetAt = new Date(entry.windowStart + windowMs);

      if (entry.count > maxAttempts) {
        return { allowed: false, remaining: 0, resetAt };
      }

      return {
        allowed: true,
        remaining: maxAttempts - entry.count,
        resetAt,
      };
    },
  };
}
