import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit/limiter";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure rate limiting is enabled during tests
    delete process.env.RATE_LIMIT_DISABLED;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests within the limit", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 3 });

    // when
    const result1 = limiter.check("user-1");
    const result2 = limiter.check("user-1");
    const result3 = limiter.check("user-1");

    // then
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 2 });

    // when
    limiter.check("user-1");
    limiter.check("user-1");
    const result = limiter.check("user-1");

    // then
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should return a resetAt date in the future when blocked", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
    const now = new Date();

    // when
    limiter.check("user-1");
    const result = limiter.check("user-1");

    // then
    expect(result.allowed).toBe(false);
    expect(result.resetAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should reset after the window expires", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
    limiter.check("user-1");
    const blocked = limiter.check("user-1");
    expect(blocked.allowed).toBe(false);

    // when - advance past the window
    vi.advanceTimersByTime(60_001);
    const result = limiter.check("user-1");

    // then
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should track identifiers independently", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });

    // when
    limiter.check("user-1");
    const resultUser1 = limiter.check("user-1");
    const resultUser2 = limiter.check("user-2");

    // then
    expect(resultUser1.allowed).toBe(false);
    expect(resultUser2.allowed).toBe(true);
  });

  it("should allow all requests when RATE_LIMIT_DISABLED is set", () => {
    // given
    process.env.RATE_LIMIT_DISABLED = "true";
    const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });

    // when
    limiter.check("user-1");
    limiter.check("user-1");
    const result = limiter.check("user-1");

    // then
    expect(result.allowed).toBe(true);
  });

  it("should clean up expired entries on check", () => {
    // given
    const limiter = createRateLimiter({ windowMs: 1_000, maxAttempts: 1 });
    limiter.check("user-1");
    expect(limiter.check("user-1").allowed).toBe(false);

    // when - advance past the window
    vi.advanceTimersByTime(1_001);

    // then - new check should succeed (expired entry cleaned)
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
  });
});
