import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createToken,
  findByTokenHash,
  revokeToken,
  revokeAllTokensForRegistration,
  findActiveTokenForRegistration,
} from "@/repositories/token-repository";

// ── Mock Prisma ──

const mockRegistrationToken = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/repositories/prisma", () => ({
  prisma: {
    registrationToken: mockRegistrationToken,
  },
}));

// ── Fixtures ──

const now = new Date("2026-02-12T12:00:00.000Z");
const futureDate = new Date("2026-05-12T12:00:00.000Z");

const dbToken = {
  id: "token-1",
  registrationId: "reg-1",
  tokenHash: "abc123hash",
  expiresAt: futureDate,
  isRevoked: false,
  createdAt: now,
};

// ── Timer management (deterministic Date) ──

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ──

describe("createToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a token and return typed output", async () => {
    // given
    // - prisma returns a new token row
    mockRegistrationToken.create.mockResolvedValue(dbToken);

    // when
    const result = await createToken("reg-1", "abc123hash", futureDate);

    // then
    expect(mockRegistrationToken.create).toHaveBeenCalledOnce();
    expect(mockRegistrationToken.create).toHaveBeenCalledWith({
      data: {
        registrationId: "reg-1",
        tokenHash: "abc123hash",
        expiresAt: futureDate,
      },
    });
    expect(result).toEqual({
      id: "token-1",
      registrationId: "reg-1",
      tokenHash: "abc123hash",
      expiresAt: futureDate,
      isRevoked: false,
      createdAt: now,
    });
  });
});

describe("findByTokenHash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return token data when token is valid", async () => {
    // given
    // - prisma finds a non-revoked, non-expired token
    mockRegistrationToken.findFirst.mockResolvedValue(dbToken);

    // when
    const result = await findByTokenHash("abc123hash");

    // then
    expect(result).toEqual({
      id: "token-1",
      registrationId: "reg-1",
      tokenHash: "abc123hash",
      expiresAt: futureDate,
      isRevoked: false,
      createdAt: now,
    });
  });

  it("should query with filters for non-revoked and non-expired tokens", async () => {
    // given
    // - prisma returns a matching token
    mockRegistrationToken.findFirst.mockResolvedValue(dbToken);

    // when
    await findByTokenHash("abc123hash");

    // then
    expect(mockRegistrationToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: "abc123hash",
        isRevoked: false,
        expiresAt: { gt: now },
      },
    });
  });

  it("should return null when token is revoked", async () => {
    // given
    // - prisma returns null because the query filters out revoked tokens
    mockRegistrationToken.findFirst.mockResolvedValue(null);

    // when
    const result = await findByTokenHash("revoked-token-hash");

    // then
    expect(result).toBeNull();
  });

  it("should return null when token is expired", async () => {
    // given
    // - prisma returns null because the query filters out expired tokens
    mockRegistrationToken.findFirst.mockResolvedValue(null);

    // when
    const result = await findByTokenHash("expired-token-hash");

    // then
    expect(result).toBeNull();
  });

  it("should return null when token hash does not exist", async () => {
    // given
    // - prisma returns null because no token with this hash exists
    mockRegistrationToken.findFirst.mockResolvedValue(null);

    // when
    const result = await findByTokenHash("non-existent-hash");

    // then
    expect(result).toBeNull();
  });
});

describe("revokeToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set isRevoked to true and return updated token", async () => {
    // given
    // - prisma returns the token with isRevoked set to true
    const revokedToken = { ...dbToken, isRevoked: true };
    mockRegistrationToken.update.mockResolvedValue(revokedToken);

    // when
    const result = await revokeToken("token-1");

    // then
    expect(mockRegistrationToken.update).toHaveBeenCalledWith({
      where: { id: "token-1" },
      data: { isRevoked: true },
    });
    expect(result.isRevoked).toBe(true);
    expect(result.id).toBe("token-1");
  });
});

describe("revokeAllTokensForRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should batch update all tokens for a registration to revoked", async () => {
    // given
    // - three tokens exist for the registration
    mockRegistrationToken.updateMany.mockResolvedValue({ count: 3 });

    // when
    const result = await revokeAllTokensForRegistration("reg-1");

    // then
    expect(mockRegistrationToken.updateMany).toHaveBeenCalledWith({
      where: { registrationId: "reg-1" },
      data: { isRevoked: true },
    });
    expect(result).toBe(3);
  });

  it("should return zero when no tokens exist for the registration", async () => {
    // given
    // - no tokens exist for this registration
    mockRegistrationToken.updateMany.mockResolvedValue({ count: 0 });

    // when
    const result = await revokeAllTokensForRegistration("reg-no-tokens");

    // then
    expect(result).toBe(0);
  });
});

describe("findActiveTokenForRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return active token when one exists", async () => {
    // given
    // - prisma finds a non-revoked, non-expired token for the registration
    mockRegistrationToken.findFirst.mockResolvedValue(dbToken);

    // when
    const result = await findActiveTokenForRegistration("reg-1");

    // then
    expect(mockRegistrationToken.findFirst).toHaveBeenCalledWith({
      where: {
        registrationId: "reg-1",
        isRevoked: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual({
      id: "token-1",
      registrationId: "reg-1",
      tokenHash: "abc123hash",
      expiresAt: futureDate,
      isRevoked: false,
      createdAt: now,
    });
  });

  it("should return null when no active token exists", async () => {
    // given
    // - no non-revoked, non-expired token exists for this registration
    mockRegistrationToken.findFirst.mockResolvedValue(null);

    // when
    const result = await findActiveTokenForRegistration("reg-1");

    // then
    expect(result).toBeNull();
  });
});
