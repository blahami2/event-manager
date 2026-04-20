import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/usecases/register", () => ({
  registerGuest: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  maskEmail: vi.fn((email: string) => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return `${local[0]}***@${domain}`;
  }),
}));

import { POST } from "./route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import { registerGuest } from "@/lib/usecases/register";
import { logger, maskEmail } from "@/lib/logger";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/errors/app-errors";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-42" };

const validBody = {
  name: "Alice Admin",
  email: "alice@example.com",
  stay: "FRI_SUN",
  accommodation: "ANYWHERE",
  adultsCount: 2,
  childrenCount: 1,
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost:3000/api/admin/registrations/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/admin/registrations/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("should return 201 with the new registration id on success", async () => {
    // given
    // - registerGuest succeeds when bypassDeadline is true
    vi.mocked(registerGuest).mockResolvedValue({ registrationId: "reg-77" });

    // when
    const res = await POST(makePostRequest(validBody));
    const json = await res.json();

    // then
    expect(res.status).toBe(201);
    expect(json.data).toEqual({ registrationId: "reg-77" });
    expect(registerGuest).toHaveBeenCalledWith(validBody, {
      bypassDeadline: true,
    });
  });

  it("should log admin-initiated creation with masked email", async () => {
    // given
    vi.mocked(registerGuest).mockResolvedValue({ registrationId: "reg-77" });

    // when
    await POST(makePostRequest(validBody));

    // then
    expect(maskEmail).toHaveBeenCalledWith("alice@example.com");
    expect(logger.info).toHaveBeenCalledWith(
      "Admin created registration",
      expect.objectContaining({
        adminUserId: "admin-42",
        action: "create_registration",
        targetId: "reg-77",
        email: "a***@example.com",
      }),
    );
  });

  it("should return 401 when the caller is not authenticated", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());

    // when
    const res = await POST(makePostRequest(validBody));

    // then
    expect(res.status).toBe(401);
    expect(registerGuest).not.toHaveBeenCalled();
  });

  it("should return 403 when the caller is not an admin", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());

    // when
    const res = await POST(makePostRequest(validBody));

    // then
    expect(res.status).toBe(403);
    expect(registerGuest).not.toHaveBeenCalled();
  });

  it("should return 400 with field errors when the use case throws ValidationError", async () => {
    // given
    // - use case reports invalid email for the supplied body
    vi.mocked(registerGuest).mockRejectedValue(
      new ValidationError("Validation failed", { email: "Invalid email" }),
    );

    // when
    const res = await POST(
      makePostRequest({ ...validBody, email: "not-an-email" }),
    );
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toEqual({ email: "Invalid email" });
  });

  it("should return 201 even past the registration deadline because bypassDeadline is set server-side", async () => {
    // given
    // - use case receives bypassDeadline=true and therefore succeeds past the deadline
    vi.mocked(registerGuest).mockImplementation(async (_input, options) => {
      if (!options || options.bypassDeadline !== true) {
        throw new ValidationError("Registration is closed", {});
      }
      return { registrationId: "reg-past-deadline" };
    });

    // when
    const res = await POST(makePostRequest(validBody));
    const json = await res.json();

    // then
    expect(res.status).toBe(201);
    expect(json.data).toEqual({ registrationId: "reg-past-deadline" });
  });

  it("should ignore a client-supplied bypassDeadline field on the request body", async () => {
    // given
    // - a malicious client tries to sneak bypassDeadline=false into the body
    //   to disable the admin bypass; the handler must still pass
    //   bypassDeadline=true to the use case.
    vi.mocked(registerGuest).mockResolvedValue({ registrationId: "reg-99" });
    const malicious = { ...validBody, bypassDeadline: false };

    // when
    await POST(makePostRequest(malicious));

    // then
    const callArgs = vi.mocked(registerGuest).mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.[1]).toEqual({ bypassDeadline: true });
  });

  it("should return 500 on unexpected errors", async () => {
    // given
    vi.mocked(registerGuest).mockRejectedValue(new Error("DB down"));

    // when
    const res = await POST(makePostRequest(validBody));

    // then
    expect(res.status).toBe(500);
  });
});
