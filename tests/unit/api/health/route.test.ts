import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockQueryRaw = vi.fn();
vi.mock("@/repositories/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// --- Import after mocks ---

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with status ok when database is reachable", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("1.0.0");
    expect(body.timestamp).toBeDefined();
  });

  it("returns a valid ISO timestamp", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });

  it("returns 503 with status error when database is unreachable", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("error");
    expect(body.timestamp).toBeDefined();
  });

  it("does not expose error details in the response", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(body.message).toBeUndefined();
    expect(body.error).toBeUndefined();
    expect(body.stack).toBeUndefined();
  });

  it("does not include version in error response", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("DB down"));

    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeUndefined();
  });

  it("sets correct content-type header", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("logs error when database check fails", async () => {
    const { logger } = await import("@/lib/logger");
    mockQueryRaw.mockRejectedValueOnce(new Error("timeout"));

    await GET();

    expect(logger.error).toHaveBeenCalled();
  });

  it("does not require authentication", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    // GET() takes no request parameter - no auth needed
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
