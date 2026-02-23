/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock verifyAdmin
vi.mock("@/lib/auth/admin-guard", () => ({
  verifyAdmin: vi.fn(),
}));

// Mock supabase clients
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockUpdateUserById = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

vi.mock("@/lib/auth/supabase-client", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  }),
}));

import { PUT } from "../route";
import { verifyAdmin } from "@/lib/auth/admin-guard";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/admin/settings/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/settings/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue({ authenticated: true, adminId: "admin-1" });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@test.com" } },
    });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(verifyAdmin).mockRejectedValue(
      new (await import("@/lib/errors/app-errors")).AuthenticationError()
    );

    const res = await PUT(makeRequest({ currentPassword: "old", newPassword: "newpass123" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 when fields are missing", async () => {
    const res = await PUT(makeRequest({ currentPassword: "", newPassword: "" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 when new password is too short", async () => {
    const res = await PUT(makeRequest({ currentPassword: "oldpass", newPassword: "short" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 when passwords are the same", async () => {
    const res = await PUT(makeRequest({ currentPassword: "samepass1", newPassword: "samepass1" }));
    expect(res.status).toBe(400);
  });

  it("should return 403 when current password is incorrect", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: new Error("Invalid credentials") });

    const res = await PUT(makeRequest({ currentPassword: "wrong", newPassword: "newpass123" }));
    expect(res.status).toBe(403);
  });

  it("should return 200 on successful password change", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUserById.mockResolvedValue({ error: null });

    const res = await PUT(makeRequest({ currentPassword: "oldpass1", newPassword: "newpass123" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.success).toBe(true);
  });

  it("should return 500 when password update fails", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUserById.mockResolvedValue({ error: new Error("Update failed") });

    const res = await PUT(makeRequest({ currentPassword: "oldpass1", newPassword: "newpass123" }));
    expect(res.status).toBe(500);
  });
});
