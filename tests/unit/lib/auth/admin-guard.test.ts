import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-errors";

// ── Mock Setup (vi.hoisted) ──

const mockCreateAdminClient = vi.hoisted(() => vi.fn());
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

vi.mock("@/lib/auth/supabase-client", () => ({
  createAdminClient: mockCreateAdminClient,
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

function createRequestWithAuth(token: string): Request {
  return new Request("http://localhost/api/admin/test", {
    headers: { authorization: `Bearer ${token}` },
  });
}

function createRequestWithoutAuth(): Request {
  return new Request("http://localhost/api/admin/test");
}

function createRequestWithBasicAuth(): Request {
  return new Request("http://localhost/api/admin/test", {
    headers: { authorization: "Basic abc123" },
  });
}

// ── Tests ──

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient);
  });

  it("should return authenticated result with adminId for valid admin session", async () => {
    // given
    // - a request with a valid Bearer token
    const request = createRequestWithAuth(VALID_TOKEN);
    // - supabase getUser returns a valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    // - the user is in the AdminUser table
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const result = await verifyAdmin(request);

    // then
    expect(result).toEqual({
      authenticated: true,
      adminId: "admin-1",
    });
  });

  it("should throw AuthenticationError when no Authorization header", async () => {
    // given
    // - a request without an Authorization header
    const request = createRequestWithoutAuth();

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    // then
    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Authorization header is not Bearer", async () => {
    // given
    // - a request with a Basic auth header instead of Bearer
    const request = createRequestWithBasicAuth();

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    // then
    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Supabase getUser fails", async () => {
    // given
    // - a request with a valid Bearer token
    const request = createRequestWithAuth(VALID_TOKEN);
    // - supabase getUser returns an error
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    // then
    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Supabase returns no user", async () => {
    // given
    // - a request with a valid Bearer token
    const request = createRequestWithAuth(VALID_TOKEN);
    // - supabase getUser returns null user without an error
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    // then
    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthorizationError when user is not in AdminUser table", async () => {
    // given
    // - a request with a valid Bearer token
    const request = createRequestWithAuth(VALID_TOKEN);
    // - supabase getUser returns a valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-non-admin" } },
      error: null,
    });
    // - the user is NOT in the AdminUser table
    mockFindAdminBySupabaseId.mockResolvedValue(null);

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    // then
    await expect(act).rejects.toThrow(AuthorizationError);
  });

  it("should log admin authentication on success", async () => {
    // given
    // - a request with a valid Bearer token
    const request = createRequestWithAuth(VALID_TOKEN);
    // - supabase getUser returns a valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    // - the user is in the AdminUser table
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    // when
    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    await verifyAdmin(request);

    // then
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin authenticated",
      { adminUserId: "admin-1" },
    );
  });
});
