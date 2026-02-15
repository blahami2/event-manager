import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before importing route
vi.mock("@/lib/usecases/manage-registration", () => ({
  updateRegistrationByToken: vi.fn(),
  cancelRegistrationByToken: vi.fn(),
}));

vi.mock("@/lib/rate-limit/limiter", () => ({
  createRateLimiter: vi.fn(() => ({
    check: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: new Date() })),
  })),
}));

vi.mock("@/lib/logger", () => ({
  hashIp: vi.fn((ip: string) => `hashed-${ip}`),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  maskEmail: vi.fn((e: string) => e),
}));

import { PUT, DELETE } from "./route";
import { updateRegistrationByToken, cancelRegistrationByToken } from "@/lib/usecases/manage-registration";
import { createRateLimiter } from "@/lib/rate-limit/limiter";
import { NotFoundError } from "@/lib/errors/app-errors";

function makeRequest(method: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/manage", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
    },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createRateLimiter).mockReturnValue({
      check: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: new Date() })),
    });
  });

  it("returns 200 with updated registration data on success", async () => {
    vi.mocked(updateRegistrationByToken).mockResolvedValue({
      newManageUrl: "http://localhost:3000/manage/new-token",
    });

    const req = makeRequest("PUT", {
      token: "valid-token",
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      adultsCount: 2,
      childrenCount: 0,
      notes: "vegan",
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBeDefined();
    expect(updateRegistrationByToken).toHaveBeenCalledWith("valid-token", {
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      adultsCount: 2,
      childrenCount: 0,
      notes: "vegan",
    });
  });

  it("returns 404 for invalid token", async () => {
    vi.mocked(updateRegistrationByToken).mockRejectedValue(
      new NotFoundError("Link not found or expired"),
    );

    const req = makeRequest("PUT", {
      token: "bad-token",
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      adultsCount: 1,
      childrenCount: 0,
    });

    const res = await PUT(req);
    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    const mockCheck = vi.fn(() => ({ allowed: false, remaining: 0, resetAt: new Date() }));
    vi.mocked(createRateLimiter).mockReturnValue({ check: mockCheck });

    vi.resetModules();

    vi.doMock("@/lib/usecases/manage-registration", () => ({
      updateRegistrationByToken: vi.fn(),
      cancelRegistrationByToken: vi.fn(),
    }));
    vi.doMock("@/lib/rate-limit/limiter", () => ({
      createRateLimiter: vi.fn(() => ({
        check: mockCheck,
      })),
    }));
    vi.doMock("@/lib/logger", () => ({
      hashIp: vi.fn((ip: string) => `hashed-${ip}`),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      maskEmail: vi.fn((e: string) => e),
    }));

    const { PUT: PUT2 } = await import("./route");

    const req = makeRequest("PUT", {
      token: "valid-token",
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      adultsCount: 1,
      childrenCount: 0,
    });

    const res = await PUT2(req);
    expect(res.status).toBe(429);
  });

  it("returns 400 when token is missing from body", async () => {
    const req = makeRequest("PUT", {
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      adultsCount: 1,
      childrenCount: 0,
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createRateLimiter).mockReturnValue({
      check: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: new Date() })),
    });
  });

  it("returns 200 with cancellation message on success", async () => {
    vi.mocked(cancelRegistrationByToken).mockResolvedValue(undefined);

    const req = makeRequest("DELETE", { token: "valid-token" });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Registration cancelled");
    expect(cancelRegistrationByToken).toHaveBeenCalledWith("valid-token");
  });

  it("returns 404 for invalid token", async () => {
    vi.mocked(cancelRegistrationByToken).mockRejectedValue(
      new NotFoundError("Link not found or expired"),
    );

    const req = makeRequest("DELETE", { token: "bad-token" });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 when token is missing from body", async () => {
    const req = makeRequest("DELETE", {});
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
