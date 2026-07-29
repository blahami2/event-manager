import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-errors";

// ── Mock Setup (vi.hoisted) ──

const mockCreateServerClient = vi.hoisted(() => vi.fn());
const mockFindAdminBySupabaseId = vi.hoisted(() => vi.fn());
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

  it("should return 403 without writing when authenticated user is not allowlisted", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-new", email: "new@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(null);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toBeInstanceOf(AuthorizationError);
    await expect(act).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 403,
      message: "Insufficient permissions",
    });
    expect(mockFindAdminBySupabaseId).toHaveBeenCalledWith("supabase-uid-new");
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Authenticated user denied admin access",
    );
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

  it("should return 403 without provisioning for an authenticated cookie user who is not allowlisted", async () => {
    const request = createRequestWithCookie();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-new", email: "new@example.com" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(null);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 403,
      message: "Insufficient permissions",
    });
    expect(mockGetUser).toHaveBeenCalledWith();
    expect(mockFindAdminBySupabaseId).toHaveBeenCalledOnce();
    expect(mockFindAdminBySupabaseId).toHaveBeenCalledWith("supabase-uid-new");

    const clientOptions = mockCreateServerClient.mock.calls[0]?.[2];
    expect(clientOptions.cookies.getAll()).toEqual(request.cookies.getAll());
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
