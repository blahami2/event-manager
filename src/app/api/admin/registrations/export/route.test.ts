import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/usecases/admin-actions", () => ({
  exportRegistrationsCsv: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from "./route";
import { verifyAdmin } from "@/lib/auth/admin-guard";
import { exportRegistrationsCsv } from "@/lib/usecases/admin-actions";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";

const ADMIN_RESULT = { authenticated: true as const, adminId: "admin-1" };

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/registrations/export", {
    method: "GET",
    headers: { Authorization: "Bearer valid-token" },
  });
}

describe("GET /api/admin/registrations/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue(ADMIN_RESULT);
  });

  it("returns CSV with correct content-type and disposition headers", async () => {
    const csv = "name,email,stay,adultsCount,childrenCount,notes,status,createdAt\nJane,jane@example.com,FRI_SAT,2,0,,CONFIRMED,2026-01-01T00:00:00.000Z";
    vi.mocked(exportRegistrationsCsv).mockResolvedValue(csv);

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename=registrations-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const body = await res.text();
    expect(body).toBe(csv);
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthenticationError());
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(new AuthorizationError());
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(exportRegistrationsCsv).mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
