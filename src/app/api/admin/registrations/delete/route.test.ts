import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/usecases/admin-actions", () => ({
  adminDeleteRegistration: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST } from "./route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import { adminDeleteRegistration } from "@/lib/usecases/admin-actions";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/errors/app-errors";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-1" };

/** `registrationId` is validated as a UUID, so fixtures use a real one. */
const REG_ID = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

const URL = "http://localhost:3000/api/admin/registrations/delete";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid-token",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/admin/registrations/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("deletes the registration and returns its id for an authorized admin", async () => {
    // given
    vi.mocked(adminDeleteRegistration).mockResolvedValue({ id: REG_ID });

    // when
    const res = await POST(makeRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: REG_ID });
    expect(json.message).toBe("Registration deleted");
    expect(adminDeleteRegistration).toHaveBeenCalledWith(REG_ID, "admin-1");
  });

  it("returns 401 and deletes nothing when the session is not authenticated", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());

    // when
    const res = await POST(makeRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHENTICATED");
    expect(adminDeleteRegistration).not.toHaveBeenCalled();
  });

  it("returns 403 and deletes nothing when the caller is not an admin", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());

    // when
    const res = await POST(makeRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(adminDeleteRegistration).not.toHaveBeenCalled();
  });

  it("authorizes before reading the body, so an anonymous caller learns nothing about validity", async () => {
    // given
    // - a body that would also fail validation; the auth failure must win
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());

    // when
    const res = await POST(makeRequest({ registrationId: "not-a-uuid" }));
    const json = await res.json();

    // then
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it.each([
    ["a registrationId that is not a UUID", { registrationId: "reg-1" }],
    ["a missing registrationId", {}],
    ["a non-string registrationId", { registrationId: 42 }],
  ])("returns 400 naming registrationId for %s", async (_case, body) => {
    // when
    const res = await POST(makeRequest(body));
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty("registrationId");
    expect(adminDeleteRegistration).not.toHaveBeenCalled();
  });

  it("returns 400 rather than 500 for a malformed JSON body", async () => {
    // when
    const res = await POST(makeRequest("{ not json"));
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty("body");
    expect(adminDeleteRegistration).not.toHaveBeenCalled();
  });

  it("returns 404 when the registration does not exist", async () => {
    // given
    vi.mocked(adminDeleteRegistration).mockRejectedValue(
      new NotFoundError("Registration"),
    );

    // when
    const res = await POST(makeRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns a generic 500 without internal details when persistence fails", async () => {
    // given
    // - S9: the driver message must not reach the client
    vi.mocked(adminDeleteRegistration).mockRejectedValue(
      new Error("connection to db-primary.internal:5432 refused"),
    );

    // when
    const res = await POST(makeRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(500);
    expect(json.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });
});
