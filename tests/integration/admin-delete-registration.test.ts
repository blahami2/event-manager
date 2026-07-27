/**
 * Integration tests for permanent admin deletion of a registration (issue #102).
 *
 * Everything between the HTTP handler and Prisma is real here — route,
 * validation, use case, repository, error mapping and the logger. Only the two
 * genuine externals are replaced: the admin guard (Supabase) and the Prisma
 * client (Postgres). The unit tests pin each layer's behaviour in isolation;
 * these pin that the layers are actually wired to each other, which is the part
 * a passing set of isolated suites cannot tell you.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockRegistration = vi.hoisted(() => ({
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/repositories/prisma", () => ({
  prisma: { registration: mockRegistration },
}));

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

import { POST } from "@/app/api/admin/registrations/delete/route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import { AuthenticationError } from "@/lib/errors/app-errors";

const ADMIN_ID = "admin-1";
const REG_ID = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

const storedRegistration = {
  id: REG_ID,
  name: "Alice Johnson",
  email: "alice@example.com",
  stay: "FRI_SUN" as const,
  accommodation: "ANYWHERE" as const,
  adultsCount: 2,
  childrenCount: 0,
  notes: null,
  status: "CONFIRMED" as const,
  stayStartDate: null,
  stayEndDate: null,
  createdAt: new Date("2026-02-13T12:00:00.000Z"),
  updatedAt: new Date("2026-02-13T12:00:00.000Z"),
};

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/registrations/delete", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer valid-token",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

interface LogEntry {
  readonly message: string;
  readonly context: Record<string, unknown>;
}

/**
 * Raw lines the real logger emitted during a test, newest last.
 *
 * The logger is deliberately *not* mocked here: the audit entry is part of what
 * this feature promises, so the assertions read the actual serialised output.
 */
let loggedLines: string[] = [];

/** The captured lines parsed back into structured entries. */
function loggedEntries(): LogEntry[] {
  return loggedLines.map((line) => JSON.parse(line) as LogEntry);
}

describe("POST /api/admin/registrations/delete (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue({
      authenticated: true,
      adminId: ADMIN_ID,
    });
    // The logger writes structured JSON through console.warn; capture it rather
    // than letting it flood the test output.
    loggedLines = [];
    vi.spyOn(console, "warn").mockImplementation((...args: unknown[]): void => {
      loggedLines.push(String(args[0]));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes the stored row and reports the deleted id", async () => {
    // given
    // - a registration that exists and deletes cleanly
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockResolvedValue({ count: 1 });

    // when
    const res = await POST(buildRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(200);
    expect(json).toEqual({ data: { id: REG_ID }, message: "Registration deleted" });
    expect(mockRegistration.deleteMany).toHaveBeenCalledWith({ where: { id: REG_ID } });
  });

  it("deletes dependent tokens through the schema cascade, not a second statement", async () => {
    // given
    // - `RegistrationToken.registrationId` is declared `ON DELETE CASCADE`, so
    //   the guest's manage links go with the parent row. If this ever becomes
    //   an explicit second delete, the two statements must be made atomic —
    //   this test is what will notice.
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockResolvedValue({ count: 1 });

    // when
    await POST(buildRequest({ registrationId: REG_ID }));

    // then
    expect(mockRegistration.deleteMany).toHaveBeenCalledOnce();
  });

  it("writes an audit entry naming the admin, the action and the target", async () => {
    // given
    // - the row is unrecoverable afterwards, so this entry is the only trace
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockResolvedValue({ count: 1 });

    // when
    await POST(buildRequest({ registrationId: REG_ID }));

    // then
    const entry = loggedEntries().find(
      (e) => e.message === "Admin deleted registration",
    );
    expect(entry?.context).toMatchObject({
      adminUserId: ADMIN_ID,
      action: "delete_registration",
      targetId: REG_ID,
      email: "a***@example.com",
    });
  });

  it("never writes the full email address to the log", async () => {
    // given
    // - LOG3/LOG4 hold even on the path where the record ceases to exist
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockResolvedValue({ count: 1 });

    // when
    await POST(buildRequest({ registrationId: REG_ID }));

    // then
    expect(loggedLines.join("\n")).not.toContain("alice@example.com");
  });

  it("returns 404 and issues no delete when the registration is unknown", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue(null);

    // when
    const res = await POST(buildRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(mockRegistration.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 404 when a concurrent delete removed the row first", async () => {
    // given
    // - the lookup succeeded, but another admin's delete landed in between
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockResolvedValue({ count: 0 });

    // when
    const res = await POST(buildRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 without querying the database for an invalid identifier", async () => {
    // when
    const res = await POST(buildRequest({ registrationId: "reg-1" }));
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.fields).toHaveProperty("registrationId");
    expect(mockRegistration.findUnique).not.toHaveBeenCalled();
    expect(mockRegistration.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 500 hiding the driver message when persistence fails", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue(storedRegistration);
    mockRegistration.deleteMany.mockRejectedValue(
      new Error("connection to db-primary.internal:5432 refused"),
    );

    // when
    const res = await POST(buildRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    // - S9: no internal detail leaks to the client
    expect(res.status).toBe(500);
    expect(json.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
    expect(JSON.stringify(json)).not.toContain("db-primary.internal");
  });

  it("rejects an unauthenticated caller before reaching the database", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());

    // when
    const res = await POST(buildRequest({ registrationId: REG_ID }));
    const json = await res.json();

    // then
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHENTICATED");
    expect(mockRegistration.findUnique).not.toHaveBeenCalled();
    expect(mockRegistration.deleteMany).not.toHaveBeenCalled();
  });
});
