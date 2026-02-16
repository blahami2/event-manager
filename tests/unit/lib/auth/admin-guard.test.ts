import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AuthenticationError } from "@/lib/errors/app-errors";

// ── Mock Setup (vi.hoisted) ──

const mockCreateServerClient = vi.hoisted(() => vi.fn());
const mockFindAdminBySupabaseId = vi.hoisted(() => vi.fn());
const mockEnsureAdminUser = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    getUser: mockGetUser,
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("@/repositories/admin-repository", () => ({
  findAdminBySupabaseId: mockFindAdminBySupabaseId,
  ensureAdminUser: mockEnsureAdminUser,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

// ── Fixtures ──

const ADMIN_DATA = {
  id: "admin-1",
  supabaseUserId: "supabase-uid-1",
  email: "admin@example.com",
  createdAt: new Date("2026-02-12T12:00:00.000Z"),
} as const;

const VALID_TOKEN = "valid-jwt-token";

// Set required environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

function createRequestWithAuth(token: string): NextRequest {
  return new NextRequest("http://localhost/api/admin/test", {
    headers: { authorization: `Bearer ${token}` },
  });
}

function createRequestWithoutAuth(): NextRequest {
  return new NextRequest("http://localhost/api/admin/test");
}

function createRequestWithBasicAuth(): NextRequest {
  return new NextRequest("http://localhost/api/admin/test", {
    headers: { authorization: "Basic abc123" },
  });
}

function createRequestWithCookie(): NextRequest {
  return new NextRequest("http://localhost/api/admin/test", {
    headers: { cookie: "sb-test-auth-token=base64encodedtoken" },
  });
}

// ── Tests ──

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServerClient.mockReturnValue(mockSupabaseClient);
  });

  it("should return authenticated result with adminId for valid admin session", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1", email: "admin@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "admin-1",
    });
  });

  it("should throw AuthenticationError when no Authorization header or cookies", async () => {
    const request = createRequestWithoutAuth();

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Authorization header is not Bearer and no cookies", async () => {
    const request = createRequestWithBasicAuth();

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Supabase getUser fails", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Supabase returns no user", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should auto-provision admin when user is not in AdminUser table", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-new", email: "new@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(null);
    mockEnsureAdminUser.mockResolvedValue({
      id: "new-admin-id",
      supabaseUserId: "supabase-uid-new",
      email: "new@example.com",
      createdAt: new Date(),
    });

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "new-admin-id",
    });
    expect(mockEnsureAdminUser).toHaveBeenCalledWith("supabase-uid-new", "new@example.com");
  });

  it("should authenticate via cookies when no Bearer header", async () => {
    const request = createRequestWithCookie();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1", email: "admin@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const result = await verifyAdmin(request);

    expect(result).toEqual({
      authenticated: true,
      adminId: "admin-1",
    });
  });

  it("should log admin authentication on success", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1", email: "admin@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    await verifyAdmin(request);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin authenticated via Bearer token",
      { adminUserId: "admin-1" },
    );
  });
});
