/**
 * Integration tests for rate limiting across all public API endpoints.
 *
 * These tests verify that rate limiters are correctly wired into each
 * API route and that exceeding the limit produces a 429 response with
 * a Retry-After header and the correct error body.
 *
 * Each test creates its own route handler invocations using fresh
 * rate limiter instances (via module re-imports) to avoid cross-test
 * contamination.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Ensure rate limiting is active
beforeEach(() => {
  delete process.env.RATE_LIMIT_DISABLED;
});

/**
 * Helper: build a NextRequest for the given path/method with a specific IP.
 */
function buildRequest(
  path: string,
  method: string,
  body?: Record<string, unknown>,
  ip: string = "192.168.1.1",
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const init = {
    method,
    headers: {
      "x-forwarded-for": ip,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(url, init);
}

describe("Rate Limiting Integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete process.env.RATE_LIMIT_DISABLED;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("POST /api/register", () => {
    it("should return 429 with Retry-After header after 5 attempts", async () => {
      // Reset module to get fresh rate limiter
      vi.resetModules();

      // Mock the use case to avoid DB calls
      vi.doMock("@/lib/usecases/register", () => ({
        registerGuest: vi.fn().mockResolvedValue({ registrationId: "test-id" }),
      }));

      const { POST } = await import("@/app/api/register/route");

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const req = buildRequest("/api/register", "POST", {
          name: "Test",
          email: `test${i}@example.com`,
          stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
        });
        const res = await POST(req);
        expect(res.status).not.toBe(429);
      }

      // 6th request should be rate limited
      const req = buildRequest("/api/register", "POST", {
        name: "Test",
        email: "test@example.com",
        stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);

      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
    });

    it("should track different IPs independently", async () => {
      vi.resetModules();

      vi.doMock("@/lib/usecases/register", () => ({
        registerGuest: vi.fn().mockResolvedValue({ registrationId: "test-id" }),
      }));

      const { POST } = await import("@/app/api/register/route");

      // Exhaust limit for IP 1
      for (let i = 0; i < 5; i++) {
        await POST(
          buildRequest("/api/register", "POST", {
            name: "Test",
            email: `t${i}@example.com`,
            stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
          }, "10.0.0.1"),
        );
      }

      // IP 1 should be blocked
      const blocked = await POST(
        buildRequest("/api/register", "POST", {
          name: "Test",
          email: "t@example.com",
          stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
        }, "10.0.0.1"),
      );
      expect(blocked.status).toBe(429);

      // IP 2 should still be allowed
      const allowed = await POST(
        buildRequest("/api/register", "POST", {
          name: "Test",
          email: "t@example.com",
          stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
        }, "10.0.0.2"),
      );
      expect(allowed.status).not.toBe(429);
    });
  });

  describe("PUT /api/manage", () => {
    it("should return 429 with Retry-After header after 10 attempts", async () => {
      vi.resetModules();

      vi.doMock("@/lib/usecases/manage-registration", () => ({
        updateRegistrationByToken: vi.fn().mockResolvedValue({ newManageUrl: "http://test" }),
        cancelRegistrationByToken: vi.fn().mockResolvedValue(undefined),
      }));

      const { PUT } = await import("@/app/api/manage/route");

      // Make 10 allowed requests
      for (let i = 0; i < 10; i++) {
        const req = buildRequest("/api/manage", "PUT", {
          token: "valid-token",
          name: "Test",
          email: "test@example.com",
          stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
        });
        const res = await PUT(req);
        expect(res.status).not.toBe(429);
      }

      // 11th request should be rate limited
      const req = buildRequest("/api/manage", "PUT", {
        token: "valid-token",
        name: "Test",
        email: "test@example.com",
        stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
      });
      const res = await PUT(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);

      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
    });
  });

  describe("DELETE /api/manage", () => {
    it("should return 429 with Retry-After header after 10 attempts (shared with PUT)", async () => {
      vi.resetModules();

      vi.doMock("@/lib/usecases/manage-registration", () => ({
        updateRegistrationByToken: vi.fn().mockResolvedValue({ newManageUrl: "http://test" }),
        cancelRegistrationByToken: vi.fn().mockResolvedValue(undefined),
      }));

      const { PUT, DELETE: DEL } = await import("@/app/api/manage/route");

      // Use 10 attempts via PUT
      for (let i = 0; i < 10; i++) {
        await PUT(
          buildRequest("/api/manage", "PUT", {
            token: "valid-token",
            name: "Test",
            email: "test@example.com",
            stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
          }),
        );
      }

      // DELETE should also be blocked (shared limiter)
      const res = await DEL(
        buildRequest("/api/manage", "DELETE", { token: "valid-token" }),
      );

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("POST /api/resend-link", () => {
    it("should return 429 with Retry-After header after 3 attempts", async () => {
      // Use real timers for this test because resend-link has a MIN_RESPONSE_MS delay
      vi.useRealTimers();
      vi.resetModules();

      vi.doMock("@/lib/usecases/resend-link", () => ({
        resendManageLink: vi.fn().mockResolvedValue(undefined),
      }));

      const { POST } = await import("@/app/api/resend-link/route");

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const req = buildRequest("/api/resend-link", "POST", {
          email: `test${i}@example.com`,
        });
        const res = await POST(req);
        expect(res.status).not.toBe(429);
      }

      // 4th request should be rate limited
      const req = buildRequest("/api/resend-link", "POST", {
        email: "test@example.com",
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);

      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
    });
  });

  describe("POST /api/admin/login", () => {
    it("should return 429 with Retry-After header after 5 attempts within 15 minutes", async () => {
      vi.resetModules();

      // Mock Supabase to return auth error (simulating failed login)
      vi.doMock("@/lib/auth/supabase-client", () => ({
        createAdminClient: vi.fn().mockReturnValue({
          auth: {
            signInWithPassword: vi.fn().mockResolvedValue({
              data: { session: null, user: null },
              error: { message: "Invalid credentials" },
            }),
          },
        }),
      }));

      const { POST } = await import("@/app/api/admin/login/route");

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const req = buildRequest("/api/admin/login", "POST", {
          email: "admin@example.com",
          password: "wrong",
        });
        const res = await POST(req);
        expect(res.status).not.toBe(429);
      }

      // 6th request should be rate limited
      const req = buildRequest("/api/admin/login", "POST", {
        email: "admin@example.com",
        password: "wrong",
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);

      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
    });

    it("should reset after the 15-minute window", async () => {
      vi.resetModules();

      vi.doMock("@/lib/auth/supabase-client", () => ({
        createAdminClient: vi.fn().mockReturnValue({
          auth: {
            signInWithPassword: vi.fn().mockResolvedValue({
              data: { session: null, user: null },
              error: { message: "Invalid credentials" },
            }),
          },
        }),
      }));

      const { POST } = await import("@/app/api/admin/login/route");

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await POST(
          buildRequest("/api/admin/login", "POST", {
            email: "admin@example.com",
            password: "wrong",
          }),
        );
      }

      const blocked = await POST(
        buildRequest("/api/admin/login", "POST", {
          email: "admin@example.com",
          password: "wrong",
        }),
      );
      expect(blocked.status).toBe(429);

      // Advance past 15-minute window
      vi.advanceTimersByTime(15 * 60 * 1000 + 1);

      const allowed = await POST(
        buildRequest("/api/admin/login", "POST", {
          email: "admin@example.com",
          password: "wrong",
        }),
      );
      expect(allowed.status).not.toBe(429);
    });
  });

  describe("Rate limit warn logging", () => {
    it("should log a warning with hashed IP when rate limit is exceeded on register", async () => {
      vi.resetModules();

      const warnSpy = vi.fn();
      vi.doMock("@/lib/logger", async () => {
        const actual = await vi.importActual<typeof import("@/lib/logger")>("@/lib/logger");
        return {
          ...actual,
          logger: { ...actual.logger, warn: warnSpy, info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        };
      });

      vi.doMock("@/lib/usecases/register", () => ({
        registerGuest: vi.fn().mockResolvedValue({ registrationId: "test-id" }),
      }));

      const { POST } = await import("@/app/api/register/route");

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await POST(
          buildRequest("/api/register", "POST", {
            name: "Test",
            email: `t${i}@example.com`,
            stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
          }),
        );
      }

      // Trigger rate limit
      await POST(
        buildRequest("/api/register", "POST", {
          name: "Test",
          email: "t@example.com",
          stay: "FRI_SAT", adultsCount: 1, childrenCount: 0,
        }),
      );

      expect(warnSpy).toHaveBeenCalledWith(
        "Rate limit exceeded",
        expect.objectContaining({
          endpoint: "/api/register",
          ip: expect.any(String),
        }),
      );

      // Verify IP is hashed (not raw)
      const loggedIp = warnSpy.mock.calls[0]?.[1]?.ip;
      expect(loggedIp).not.toBe("192.168.1.1");
      expect(loggedIp.length).toBeGreaterThan(0);
    });
  });
});
