import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/usecases/admin-actions", () => ({
  getRegistrationStats: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from "./route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-1" };

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/registrations/stats", {
    method: "GET",
    headers: { Authorization: "Bearer valid-token" },
  });
}

const stats = {
  total: 10,
  confirmed: 8,
  cancelled: 2,
  totalAdults: 15,
  totalChildren: 3,
};

describe("GET /api/admin/registrations/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("should return the registration stats payload on success", async () => {
    // given
    // - the use case returns canned stats
    vi.mocked(getRegistrationStats).mockResolvedValueOnce(stats);

    // when
    const response = await GET(makeRequest());

    // then
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: typeof stats };
    expect(body.data).toEqual(stats);
  });

  it("should return 401 when unauthenticated", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValueOnce(new AuthenticationError());

    // when
    const response = await GET(makeRequest());

    // then
    expect(response.status).toBe(401);
  });

  it("should return 403 when the caller is not an admin", async () => {
    // given
    vi.mocked(verifyAdmin).mockRejectedValueOnce(new AuthorizationError());

    // when
    const response = await GET(makeRequest());

    // then
    expect(response.status).toBe(403);
  });
});
