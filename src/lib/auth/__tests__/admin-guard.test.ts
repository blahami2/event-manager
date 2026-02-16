import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractTokenFromCookies, verifyAdmin } from "../admin-guard";

// Mock dependencies
vi.mock("@/lib/auth/supabase-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/repositories/admin-repository", () => ({
  findAdminBySupabaseId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { createAdminClient } from "@/lib/auth/supabase-client";
import { findAdminBySupabaseId } from "@/repositories/admin-repository";

describe("extractTokenFromCookies", () => {
  it("returns null for null cookie header", () => {
    expect(extractTokenFromCookies(null)).toBeNull();
  });

  it("returns null for empty cookie header", () => {
    expect(extractTokenFromCookies("")).toBeNull();
  });

  it("returns null when no supabase auth cookie present", () => {
    expect(extractTokenFromCookies("other=value; foo=bar")).toBeNull();
  });

  it("extracts token from base64-encoded JSON array cookie", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig";
    const cookieValue = btoa(JSON.stringify([token, "refresh-token"]));
    const header = `sb-abc-auth-token=${cookieValue}`;
    expect(extractTokenFromCookies(header)).toBe(token);
  });

  it("extracts token from base64-encoded JSON object cookie", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig";
    const cookieValue = btoa(JSON.stringify({ access_token: token }));
    const header = `sb-abc-auth-token=${cookieValue}`;
    expect(extractTokenFromCookies(header)).toBe(token);
  });

  it("extracts token from chunked cookies", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig";
    const fullValue = btoa(JSON.stringify([token, "refresh"]));
    const mid = Math.floor(fullValue.length / 2);
    const chunk0 = fullValue.substring(0, mid);
    const chunk1 = fullValue.substring(mid);
    const header = `sb-abc-auth-token.0=${chunk0}; sb-abc-auth-token.1=${chunk1}`;
    expect(extractTokenFromCookies(header)).toBe(token);
  });

  it("extracts raw JWT token from cookie value", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature";
    const header = `sb-abc-auth-token=${token}`;
    expect(extractTokenFromCookies(header)).toBe(token);
  });
});

describe("verifyAdmin", () => {
  const mockGetUser = vi.fn();
  const mockSupabase = { auth: { getUser: mockGetUser } };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never);
  });

  it("authenticates via Bearer header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(findAdminBySupabaseId).mockResolvedValue({ id: "admin-1" } as never);

    const req = new Request("http://localhost/api/admin/test", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authenticated: true, adminId: "admin-1" });
    expect(mockGetUser).toHaveBeenCalledWith("valid-token");
  });

  it("authenticates via Supabase auth cookie when no Bearer header", async () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig";
    const cookieValue = btoa(JSON.stringify([token, "refresh"]));
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(findAdminBySupabaseId).mockResolvedValue({ id: "admin-1" } as never);

    const req = new Request("http://localhost/api/admin/test", {
      headers: { Cookie: `sb-abc-auth-token=${cookieValue}` },
    });
    const result = await verifyAdmin(req);
    expect(result).toEqual({ authenticated: true, adminId: "admin-1" });
    expect(mockGetUser).toHaveBeenCalledWith(token);
  });

  it("throws AuthenticationError when no token available", async () => {
    const req = new Request("http://localhost/api/admin/test");
    await expect(verifyAdmin(req)).rejects.toThrow();
  });

  it("throws AuthenticationError when supabase rejects token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });

    const req = new Request("http://localhost/api/admin/test", {
      headers: { Authorization: "Bearer bad-token" },
    });
    await expect(verifyAdmin(req)).rejects.toThrow();
  });

  it("throws AuthorizationError when user is not admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(findAdminBySupabaseId).mockResolvedValue(null);

    const req = new Request("http://localhost/api/admin/test", {
      headers: { Authorization: "Bearer valid-token" },
    });
    await expect(verifyAdmin(req)).rejects.toThrow();
  });
});
