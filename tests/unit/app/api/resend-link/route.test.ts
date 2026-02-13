import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResendManageLink = vi.hoisted(() => vi.fn());
const mockCheck = vi.hoisted(() => vi.fn());

vi.mock("@/lib/usecases/resend-link", () => ({
  resendManageLink: mockResendManageLink,
}));

vi.mock("@/lib/rate-limit/limiter", () => ({
  createRateLimiter: () => ({ check: mockCheck }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  hashIp: (ip: string) => `hashed-${ip}`,
}));

import { POST } from "@/app/api/resend-link/route";

function makeRequest(body: unknown, ip: string = "127.0.0.1"): Request {
  return new Request("http://localhost/api/resend-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const EXPECTED_MESSAGE =
  "If this email is registered, a manage link has been sent.";

describe("POST /api/resend-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheck.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetAt: new Date(),
    });
    mockResendManageLink.mockResolvedValue({ success: true });
  });

  it("should return 200 with success message for valid email", async () => {
    const response = await POST(makeRequest({ email: "test@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(EXPECTED_MESSAGE);
    expect(mockResendManageLink).toHaveBeenCalledWith("test@example.com");
  });

  it("should return identical 200 response even when use case handles non-existing email", async () => {
    mockResendManageLink.mockResolvedValue({ success: true });

    const response = await POST(makeRequest({ email: "unknown@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(EXPECTED_MESSAGE);
  });

  it("should return 429 when rate limited", async () => {
    mockCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
    });

    const response = await POST(makeRequest({ email: "test@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mockResendManageLink).not.toHaveBeenCalled();
  });

  it("should return 400 for missing email", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for invalid email format", async () => {
    const response = await POST(makeRequest({ email: "not-an-email" }));

    expect(response.status).toBe(400);
  });

  it("should extract IP from x-forwarded-for header", async () => {
    await POST(makeRequest({ email: "test@example.com" }, "1.2.3.4"));

    expect(mockCheck).toHaveBeenCalledWith("hashed-1.2.3.4");
  });

  it("should return 200 even when use case throws (no info leakage)", async () => {
    mockResendManageLink.mockRejectedValue(new Error("DB error"));

    const response = await POST(makeRequest({ email: "test@example.com" }));

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe(EXPECTED_MESSAGE);
  });

  it("should apply rate limit before calling use case", async () => {
    mockCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
    });

    await POST(makeRequest({ email: "test@example.com" }));

    expect(mockCheck).toHaveBeenCalled();
    expect(mockResendManageLink).not.toHaveBeenCalled();
  });
});
