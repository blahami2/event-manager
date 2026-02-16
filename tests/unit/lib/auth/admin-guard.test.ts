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

/** Create a base64url-encoded cookie value like @supabase/ssr v0.8+ does */
function createBase64Cookie(session: Record<string, unknown>): string {
  const json = JSON.stringify(session);
  const b64 = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `base64-${b64}`;
}

function createRequestWithCookie(cookieName: string, cookieValue: string): Request {
  return new Request("http://localhost/api/admin/test", {
    headers: { cookie: `${cookieName}=${cookieValue}` },
  });
}

// ── Tests ──

describe("extractTokenFromCookies", () => {
  it("should return null for null cookie header", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    expect(extractTokenFromCookies(null)).toBeNull();
  });

  it("should return null for empty cookie header", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    expect(extractTokenFromCookies("")).toBeNull();
  });

  it("should return null when no supabase auth cookie exists", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    expect(extractTokenFromCookies("other-cookie=value")).toBeNull();
  });

  it("should extract token from base64url-encoded cookie (supabase/ssr v0.8+ format)", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    const session = { access_token: "my-jwt-token", refresh_token: "refresh" };
    const cookieValue = createBase64Cookie(session);
    const header = `sb-myref-auth-token=${cookieValue}`;
    expect(extractTokenFromCookies(header)).toBe("my-jwt-token");
  });

  it("should extract token from chunked base64url-encoded cookies", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    const session = { access_token: "chunked-jwt-token", refresh_token: "refresh", extra: "x".repeat(200) };
    const fullValue = createBase64Cookie(session);
    // Split into chunks
    const mid = Math.floor(fullValue.length / 2);
    const chunk0 = fullValue.substring(0, mid);
    const chunk1 = fullValue.substring(mid);
    const header = `sb-ref-auth-token.0=${chunk0}; sb-ref-auth-token.1=${chunk1}`;
    expect(extractTokenFromCookies(header)).toBe("chunked-jwt-token");
  });

  it("should extract token from plain JSON object cookie (legacy format)", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    const session = { access_token: "legacy-token", refresh_token: "r" };
    // Plain base64 (no "base64-" prefix)
    const b64 = btoa(JSON.stringify(session));
    const header = `sb-ref-auth-token=${b64}`;
    expect(extractTokenFromCookies(header)).toBe("legacy-token");
  });

  it("should extract token from JSON array cookie (older format)", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    const arr = ["array-token", "refresh"];
    const b64 = btoa(JSON.stringify(arr));
    const header = `sb-ref-auth-token=${b64}`;
    expect(extractTokenFromCookies(header)).toBe("array-token");
  });

  it("should extract raw JWT token when cookie value is a JWT", async () => {
    const { extractTokenFromCookies } = await import("@/lib/auth/admin-guard");
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sigs";
    const header = `sb-ref-auth-token=${jwt}`;
    expect(extractTokenFromCookies(header)).toBe(jwt);
  });
});

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient);
  });

  it("should return authenticated result with adminId for valid admin session", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
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

  it("should throw AuthenticationError when no Authorization header and no cookies", async () => {
    const request = createRequestWithoutAuth();

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError when Authorization header is not Bearer", async () => {
    const request = createRequestWithBasicAuth();

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthenticationError);
  });

  it("should authenticate via cookie when no Bearer token", async () => {
    const session = { access_token: "cookie-jwt", refresh_token: "r" };
    const cookieValue = createBase64Cookie(session);
    const request = createRequestWithCookie("sb-ref-auth-token", cookieValue);

    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const result = await verifyAdmin(request);

    expect(result).toEqual({ authenticated: true, adminId: "admin-1" });
    expect(mockGetUser).toHaveBeenCalledWith("cookie-jwt");
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

  it("should throw AuthorizationError when user is not in AdminUser table", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-non-admin" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(null);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    const act = verifyAdmin(request);

    await expect(act).rejects.toThrow(AuthorizationError);
  });

  it("should log admin authentication on success", async () => {
    const request = createRequestWithAuth(VALID_TOKEN);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    mockFindAdminBySupabaseId.mockResolvedValue(ADMIN_DATA);

    const { verifyAdmin } = await import("@/lib/auth/admin-guard");
    await verifyAdmin(request);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin authenticated",
      { adminUserId: "admin-1" },
    );
  });
});
