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
} from "@/lib/errors/app-errors";
import { RegistrationStatus } from "@/types/registration";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-1" };

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
      search: "jane",
      page: "2",
      pageSize: "10",
    }));

    expect(res.status).toBe(200);
    expect(listRegistrationsPaginated).toHaveBeenCalledWith({
      status: RegistrationStatus.CONFIRMED,
      search: "jane",
      page: 2,
      pageSize: 10,
    });
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
      guestCount: 2,
      dietaryNotes: null,
      status: RegistrationStatus.CONFIRMED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 2,
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(adminEditRegistration).toHaveBeenCalledWith(
      "reg-1",
      { name: "Jane", email: "jane@example.com", guestCount: 2 },
      "admin-1",
    );
  });

  it("passes dietaryNotes when provided", async () => {
    const mockReg = {
      id: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 1,
      dietaryNotes: "vegan",
      status: RegistrationStatus.CONFIRMED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminEditRegistration).mockResolvedValue(mockReg);

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 1,
      dietaryNotes: "vegan",
    }));

    expect(res.status).toBe(200);
    expect(adminEditRegistration).toHaveBeenCalledWith(
      "reg-1",
      { name: "Jane", email: "jane@example.com", guestCount: 1, dietaryNotes: "vegan" },
      "admin-1",
    );
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 1,
    }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: "reg-1",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 1,
    }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when registration not found", async () => {
    vi.mocked(adminEditRegistration).mockRejectedValue(new NotFoundError("Registration"));

    const res = await PUT(makeMutationRequest("PUT", {
      registrationId: "nonexistent",
      name: "Jane",
      email: "jane@example.com",
      guestCount: 1,
    }));
    expect(res.status).toBe(404);
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
      guestCount: 1,
      dietaryNotes: null,
      status: RegistrationStatus.CANCELLED,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };
    vi.mocked(adminCancelRegistration).mockResolvedValue(mockReg);

    const res = await DELETE(makeMutationRequest("DELETE", {
      registrationId: "reg-1",
    }));
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
