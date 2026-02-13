import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ValidationError } from "@/lib/errors/app-errors";

// --- Mocks ---

const mockRegisterGuest = vi.fn();
vi.mock("@/lib/usecases/register", () => ({
  registerGuest: (...args: unknown[]) => mockRegisterGuest(...args),
}));

const mockRateLimiterCheck = vi.fn();
vi.mock("@/lib/rate-limit/limiter", () => ({
  createRateLimiter: () => ({ check: mockRateLimiterCheck }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  maskEmail: (e: string) => e.replace(/^(.).*@/, "$1***@"),
  hashIp: (ip: string) => `hashed-${ip}`,
}));

// --- Helpers ---

function buildRequest(
  body: unknown,
  ip = "192.168.1.1",
): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
  return req;
}

const validBody = {
  name: "Alice",
  email: "alice@example.com",
  guestCount: 2,
};

// --- Tests ---

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimiterCheck.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: new Date(Date.now() + 3600000),
    });
  });

  async function callRoute(req: NextRequest): Promise<Response> {
    // Dynamic import to get fresh module with mocks applied
    const { POST } = await import("@/app/api/register/route");
    return POST(req);
  }

  it("returns 201 with registrationId on success", async () => {
    mockRegisterGuest.mockResolvedValue({ registrationId: "reg-123" });
    const req = buildRequest(validBody);

    const res = await callRoute(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({
      data: { registrationId: "reg-123" },
      message: "Registration successful",
    });
    expect(mockRegisterGuest).toHaveBeenCalledWith(validBody);
  });

  it("delegates to registerGuest use case", async () => {
    mockRegisterGuest.mockResolvedValue({ registrationId: "reg-456" });
    const input = { ...validBody, dietaryNotes: "Vegan" };

    await callRoute(buildRequest(input));

    expect(mockRegisterGuest).toHaveBeenCalledWith(input);
  });

  it("returns 400 on validation failure", async () => {
    mockRegisterGuest.mockRejectedValue(
      new ValidationError("Validation failed", { email: "Invalid email" }),
    );

    const res = await callRoute(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields).toEqual({ email: "Invalid email" });
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    const resetAt = new Date(Date.now() + 1800000);
    mockRateLimiterCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt,
    });

    const res = await callRoute(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(res.headers.get("Retry-After")).toBeTruthy();
    // registerGuest should NOT be called
    expect(mockRegisterGuest).not.toHaveBeenCalled();
  });

  it("returns 500 on unknown error", async () => {
    mockRegisterGuest.mockRejectedValue(new Error("DB connection failed"));

    const res = await callRoute(buildRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("An unexpected error occurred");
    // Must not leak internal details
    expect(JSON.stringify(body)).not.toContain("DB connection");
  });

  it("applies rate limit before calling use case", async () => {
    mockRateLimiterCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000),
    });

    await callRoute(buildRequest(validBody));

    expect(mockRateLimiterCheck).toHaveBeenCalled();
    expect(mockRegisterGuest).not.toHaveBeenCalled();
  });

  it("extracts IP from x-forwarded-for header", async () => {
    mockRegisterGuest.mockResolvedValue({ registrationId: "reg-789" });

    await callRoute(buildRequest(validBody, "10.0.0.1"));

    expect(mockRateLimiterCheck).toHaveBeenCalledWith("hashed-10.0.0.1");
  });

  it("uses fallback IP when x-forwarded-for is missing", async () => {
    mockRegisterGuest.mockResolvedValue({ registrationId: "reg-000" });
    const req = new NextRequest("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });

    await callRoute(req);

    expect(mockRateLimiterCheck).toHaveBeenCalledWith("hashed-unknown");
  });

  it("does not expose raw tokens in response", async () => {
    mockRegisterGuest.mockResolvedValue({ registrationId: "reg-123" });

    const res = await callRoute(buildRequest(validBody));
    const text = await res.clone().text();

    expect(text).not.toMatch(/token/i);
  });
});
