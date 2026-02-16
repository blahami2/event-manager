import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyAdmin } from "../admin-guard";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock dependencies
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/repositories/admin-repository", () => ({
  findAdminBySupabaseId: vi.fn(),
  ensureAdminUser: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import { findAdminBySupabaseId, ensureAdminUser } from "@/repositories/admin-repository";

// Set required environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates via Bearer header", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user123", email: "admin@example.com" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
    vi.mocked(findAdminBySupabaseId).mockResolvedValue({
      id: "admin-id",
      supabaseUserId: "user123",
      email: "admin@example.com",
      createdAt: new Date(),
    });

    const request = new NextRequest("https://example.com/api/admin/test", {
      headers: {
        authorization: "Bearer test-token",
      },
    });

    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "admin-id",
    });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("test-token");
  });

  it("authenticates via Supabase auth cookie when no Bearer header", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user123", email: "admin@example.com" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
    vi.mocked(findAdminBySupabaseId).mockResolvedValue({
      id: "admin-id",
      supabaseUserId: "user123",
      email: "admin@example.com",
      createdAt: new Date(),
    });

    const request = new NextRequest("https://example.com/api/admin/test", {
      headers: {
        cookie: "sb-test-auth-token=base64encodedtoken",
      },
    });

    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "admin-id",
    });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith();
  });

  it("throws AuthenticationError when no auth header or cookie", async () => {
    const request = new NextRequest("https://example.com/api/admin/test");

    await expect(verifyAdmin(request)).rejects.toThrow("Authentication required");
  });

  it("throws AuthenticationError when Supabase auth fails", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid token" },
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);

    const request = new NextRequest("https://example.com/api/admin/test", {
      headers: {
        authorization: "Bearer invalid-token",
      },
    });

    await expect(verifyAdmin(request)).rejects.toThrow("Authentication required");
  });

  it("auto-provisions admin when user is authenticated but not in AdminUser table", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user123", email: "user@example.com" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
    vi.mocked(findAdminBySupabaseId).mockResolvedValue(null);
    vi.mocked(ensureAdminUser).mockResolvedValue({
      id: "new-admin-id",
      supabaseUserId: "user123",
      email: "user@example.com",
      createdAt: new Date(),
    });

    const request = new NextRequest("https://example.com/api/admin/test", {
      headers: {
        authorization: "Bearer test-token",
      },
    });

    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "new-admin-id",
    });
    expect(ensureAdminUser).toHaveBeenCalledWith("user123", "user@example.com");
  });
});
