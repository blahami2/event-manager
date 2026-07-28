import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/usecases/admin-actions", () => ({
  listRegistrationsPaginated: vi.fn(),
  adminEditRegistration: vi.fn(),
  adminCancelRegistration: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET, PUT, DELETE } from "./route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import {
  listRegistrationsPaginated,
  adminEditRegistration,
  adminCancelRegistration,
} from "@/lib/usecases/admin-actions";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-errors";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-1" };

/**
 * `registrationId` is validated as a UUID, so fixtures use real ones. `reg-1`
 * would now be rejected before it reached the use case — which is the point:
 * the column is a Postgres `uuid` and a free-form string used to surface as an
 * unhandled driver error.
 */
const REG_ID = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
const OTHER_REG_ID = "9a8b7c6d-5e4f-4a3b-8c1d-0e9f8a7b6c5d";

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/admin/registrations");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url, {
    method: "GET",
    headers: { Authorization: "Bearer valid-token" },
  });
}

function makeMutationRequest(method: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/registrations", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid-token",
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("returns paginated registrations with default params", async () => {
    const mockResult = { items: [], total: 0, page: 1, pageSize: 20 };
    vi.mocked(listRegistrationsPaginated).mockResolvedValue(mockResult);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(mockResult);
    expect(listRegistrationsPaginated).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    });
  });

  it("passes filter params to use case", async () => {
    const mockResult = { items: [], total: 0, page: 2, pageSize: 10 };
    vi.mocked(listRegistrationsPaginated).mockResolvedValue(mockResult);

    const res = await GET(makeGetRequest({
      status: "CONFIRMED",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      search: "jane",
      page: "2",
      pageSize: "10",
    }));

    expect(res.status).toBe(200);
    expect(listRegistrationsPaginated).toHaveBeenCalledWith({
      status: RegistrationStatus.CONFIRMED,
      stay: StayOption.FRI_SAT,
      accommodation: AccommodationOption.ANYWHERE,
      search: "jane",
      page: 2,
      pageSize: 10,
    });
  });

  it.each([
    ["stay", "NOT_A_STAY"],
    ["accommodation", "NOT_AN_ACCOMMODATION"],
  ])("returns 400 for an invalid %s filter without querying registrations", async (field, value) => {
    const res = await GET(makeGetRequest({ [field]: value }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields[field]).toBeDefined();
    expect(listRegistrationsPaginated).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/admin/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("returns 200 with updated registration on success", async () => {
    const mockReg = {
      id: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      stay: StayOption.FRI_SAT,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      notes: null,
      stayStartDate: null,
      stayEndDate: null,
      status: RegistrationStatus.CONFIRMED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      adultsCount: 2,
      childrenCount: 0,
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(adminEditRegistration).toHaveBeenCalledWith(
      REG_ID,
      {
        name: "Jane",
        email: "jane@example.com",
        stay: "FRI_SAT",
        accommodation: "ANYWHERE",
        adultsCount: 2,
        childrenCount: 0,
      },
      "admin-1",
    );
  });

  it("passes notes when provided", async () => {
    const mockReg = {
      id: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      stay: StayOption.FRI_SAT,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 1,
      childrenCount: 0,
      notes: "vegan",
      stayStartDate: null,
      stayEndDate: null,
      status: RegistrationStatus.CONFIRMED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      adultsCount: 1,
      childrenCount: 0,
      notes: "vegan",
    }));

    expect(res.status).toBe(200);
    expect(adminEditRegistration).toHaveBeenCalledWith(
      REG_ID,
      {
        name: "Jane",
        email: "jane@example.com",
        stay: "FRI_SAT",
        accommodation: "ANYWHERE",
        adultsCount: 1,
        childrenCount: 0,
        notes: "vegan",
      },
      "admin-1",
    );
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());
    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      adultsCount: 1,
      childrenCount: 0,
    }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());
    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      adultsCount: 1,
      childrenCount: 0,
    }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when registration not found", async () => {
    vi.mocked(adminEditRegistration).mockRejectedValue(new NotFoundError("Registration"));
    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: OTHER_REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: "FRI_SAT",
      accommodation: "ANYWHERE",
      adultsCount: 1,
      childrenCount: 0,
    }));
    expect(res.status).toBe(404);
  });
});

/**
 * The route is a pass-through (L3): it forwards the custom date range to the
 * use case, which owns validation. These tests pin the wire contract.
 */
describe("PUT /api/admin/registrations custom stay date range", () => {
  const baseBody = {
    registrationId: REG_ID,
    name: "Jane",
    email: "jane@example.com",
    stay: "SAT_SUN",
    accommodation: "ANYWHERE",
    adultsCount: 2,
    childrenCount: 0,
  };

  const mockReg = {
    id: "reg-1",
    name: "Jane",
    email: "jane@example.com",
    stay: StayOption.SAT_SUN,
    accommodation: AccommodationOption.ANYWHERE,
    adultsCount: 2,
    childrenCount: 0,
    notes: null,
    stayStartDate: "2026-07-10",
    stayEndDate: "2026-07-13",
    status: RegistrationStatus.CONFIRMED,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("forwards an arbitrary date range to the use case", async () => {
    // given
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    // when
    const res = await PUT(makeMutationRequest("PUT", {
      ...baseBody,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    }));

    // then
    expect(res.status).toBe(200);
    expect(adminEditRegistration).toHaveBeenCalledWith(
      REG_ID,
      expect.objectContaining({ stayStartDate: "2026-07-10", stayEndDate: "2026-07-13" }),
      "admin-1",
    );
  });

  it("forwards explicit nulls when the admin clears the range", async () => {
    // given
    vi.mocked(adminEditRegistration).mockResolvedValue({
      ...mockReg,
      stayStartDate: null,
      stayEndDate: null,
    });

    // when
    const res = await PUT(makeMutationRequest("PUT", {
      ...baseBody,
      stayStartDate: null,
      stayEndDate: null,
    }));

    // then
    expect(res.status).toBe(200);
    expect(adminEditRegistration).toHaveBeenCalledWith(
      REG_ID,
      expect.objectContaining({ stayStartDate: null, stayEndDate: null }),
      "admin-1",
    );
  });

  it("omits the range fields when the body does not carry them", async () => {
    // given
    // - backwards compatibility with clients that predate custom ranges
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    // when
    await PUT(makeMutationRequest("PUT", baseBody));

    // then
    const forwarded = vi.mocked(adminEditRegistration).mock.calls[0]?.[1];
    expect(Object.keys(forwarded ?? {})).not.toContain("stayStartDate");
    expect(Object.keys(forwarded ?? {})).not.toContain("stayEndDate");
  });

  it("returns 400 with field details when the use case rejects the range", async () => {
    // given
    // - the use case validates the range again (defense in depth); a rejection
    //   there must still reach the client as a field-level 400
    vi.mocked(adminEditRegistration).mockRejectedValue(
      new ValidationError("Validation failed", {
        stayEndDate: "End date must not be before the start date",
      }),
    );

    // when
    const res = await PUT(makeMutationRequest("PUT", {
      ...baseBody,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    }));
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.fields).toHaveProperty("stayEndDate");
  });
});

/**
 * The whole body is validated before anything is forwarded. Previously every
 * field was cast (`name as string`, `adultsCount as number`) and handed to the
 * use case, so a malformed payload from an authenticated admin session reached
 * Prisma and came back as a generic `500` with no indication of what was wrong.
 */
describe("PUT /api/admin/registrations payload validation", () => {
  const baseBody = {
    registrationId: REG_ID,
    name: "Jane",
    email: "jane@example.com",
    stay: "SAT_SUN",
    accommodation: "ANYWHERE",
    adultsCount: 2,
    childrenCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it.each([
    ["a registrationId that is not a UUID", { registrationId: "reg-1" }, "registrationId"],
    ["a missing name", { name: undefined }, "name"],
    ["a non-string name", { name: { toString: "evil" } }, "name"],
    ["an invalid email", { email: "not-an-email" }, "email"],
    ["an unknown stay option", { stay: "WHENEVER" }, "stay"],
    ["an unknown accommodation option", { accommodation: "PENTHOUSE" }, "accommodation"],
    ["a non-numeric adultsCount", { adultsCount: "two" }, "adultsCount"],
    ["an out-of-range childrenCount", { childrenCount: 99 }, "childrenCount"],
    ["notes beyond the stored length", { notes: "x".repeat(501) }, "notes"],
    ["a range outside the supported window", { stayStartDate: "1850-01-01", stayEndDate: "1850-01-05" }, "stayStartDate"],
    ["an inverted range", { stayStartDate: "2026-07-13", stayEndDate: "2026-07-10" }, "stayEndDate"],
    ["a half-supplied range", { stayStartDate: "2026-07-13" }, "stayEndDate"],
  ])("returns 400 naming the field for %s", async (_case, override, field) => {
    // when
    const res = await PUT(makeMutationRequest("PUT", { ...baseBody, ...override }));
    const json = await res.json();

    // then
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty(field);
    // - nothing reaches the use case, so nothing reaches the database
    expect(adminEditRegistration).not.toHaveBeenCalled();
  });

  it("returns 400 rather than 500 for a body that is not an object", async () => {
    // when
    const res = await PUT(
      new NextRequest("http://localhost:3000/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
        body: JSON.stringify("not-a-body"),
      }),
    );

    // then
    expect(res.status).toBe(400);
    expect(adminEditRegistration).not.toHaveBeenCalled();
  });

  it("returns 400 rather than 500 for a malformed JSON body", async () => {
    // when
    const res = await PUT(
      new NextRequest("http://localhost:3000/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
        body: "{ not json",
      }),
    );

    // then
    expect(res.status).toBe(400);
    expect(adminEditRegistration).not.toHaveBeenCalled();
  });

  it("does not forward server-owned fields a client tried to smuggle in", async () => {
    // given
    // - status and id belong to the server; the edit endpoint must ignore them
    vi.mocked(adminEditRegistration).mockResolvedValue({
      id: REG_ID,
      name: "Jane",
      email: "jane@example.com",
      stay: StayOption.SAT_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      notes: null,
      stayStartDate: null,
      stayEndDate: null,
      status: RegistrationStatus.CONFIRMED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    });

    // when
    await PUT(makeMutationRequest("PUT", { ...baseBody, status: "CANCELLED", id: OTHER_REG_ID }));

    // then
    const forwarded = vi.mocked(adminEditRegistration).mock.calls[0]?.[1];
    expect(forwarded).not.toHaveProperty("status");
    expect(forwarded).not.toHaveProperty("id");
  });
});

describe("DELETE /api/admin/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("returns 200 on successful cancellation", async () => {
    const mockReg = {
      id: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      stay: StayOption.FRI_SAT,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 1,
      childrenCount: 0,
      notes: null,
      stayStartDate: null,
      stayEndDate: null,
      status: RegistrationStatus.CANCELLED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminCancelRegistration).mockResolvedValue(mockReg);

    const res = await DELETE(makeMutationRequest("DELETE", { registrationId: "reg-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBeDefined();
    expect(adminCancelRegistration).toHaveBeenCalledWith("reg-1", "admin-1");
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());
    const res = await DELETE(makeMutationRequest("DELETE", { registrationId: "reg-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());
    const res = await DELETE(makeMutationRequest("DELETE", { registrationId: "reg-1" }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when registration not found", async () => {
    vi.mocked(adminCancelRegistration).mockRejectedValue(new NotFoundError("Registration"));
    const res = await DELETE(makeMutationRequest("DELETE", { registrationId: "reg-1" }));
    expect(res.status).toBe(404);
  });
});
