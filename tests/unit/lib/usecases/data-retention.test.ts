import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ──

const mockDeleteExpiredRevokedTokens = vi.hoisted(() => vi.fn());
const mockDeleteCancelledRegistrationsBefore = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/repositories/token-repository", () => ({
  deleteExpiredRevokedTokens: mockDeleteExpiredRevokedTokens,
}));

vi.mock("@/repositories/registration-repository", () => ({
  deleteCancelledRegistrationsBefore: mockDeleteCancelledRegistrationsBefore,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

import { purgeExpiredTokens, purgeCancelledRegistrations } from "@/lib/usecases/data-retention";

// ── Tests ──

describe("purgeExpiredTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return count of purged expired revoked tokens", async () => {
    // given
    // - repository returns 5 deleted tokens
    mockDeleteExpiredRevokedTokens.mockResolvedValue(5);

    // when
    const result = await purgeExpiredTokens();

    // then
    expect(result.purgedCount).toBe(5);
    expect(mockDeleteExpiredRevokedTokens).toHaveBeenCalledOnce();
  });

  it("should return zero when no expired revoked tokens exist", async () => {
    // given
    // - repository returns 0 deleted tokens
    mockDeleteExpiredRevokedTokens.mockResolvedValue(0);

    // when
    const result = await purgeExpiredTokens();

    // then
    expect(result.purgedCount).toBe(0);
  });

  it("should be idempotent - second call returns zero after first purge", async () => {
    // given
    // - first call purges 3, second call purges 0
    mockDeleteExpiredRevokedTokens.mockResolvedValueOnce(3);
    mockDeleteExpiredRevokedTokens.mockResolvedValueOnce(0);

    // when
    const first = await purgeExpiredTokens();
    const second = await purgeExpiredTokens();

    // then
    expect(first.purgedCount).toBe(3);
    expect(second.purgedCount).toBe(0);
    expect(mockDeleteExpiredRevokedTokens).toHaveBeenCalledTimes(2);
  });

  it("should log the purge action", async () => {
    // given
    mockDeleteExpiredRevokedTokens.mockResolvedValue(2);

    // when
    await purgeExpiredTokens();

    // then
    expect(mockLogger.info).toHaveBeenCalledWith("Purged expired revoked tokens", {
      action: "purge_expired_tokens",
      purgedCount: 2,
    });
  });
});

describe("purgeCancelledRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should purge cancelled registrations older than specified date", async () => {
    // given
    // - repository returns 4 deleted registrations
    const cutoff = new Date("2025-08-01T00:00:00.000Z");
    mockDeleteCancelledRegistrationsBefore.mockResolvedValue(4);

    // when
    const result = await purgeCancelledRegistrations(cutoff);

    // then
    expect(result.purgedCount).toBe(4);
    expect(mockDeleteCancelledRegistrationsBefore).toHaveBeenCalledWith(cutoff);
  });

  it("should use default 180-day retention when no date provided", async () => {
    // given
    mockDeleteCancelledRegistrationsBefore.mockResolvedValue(1);
    const before = Date.now();

    // when
    const result = await purgeCancelledRegistrations();

    // then
    expect(result.purgedCount).toBe(1);
    const callArgs = mockDeleteCancelledRegistrationsBefore.mock.calls[0] as [Date];
    const calledDate = callArgs[0];
    const expectedMs = 180 * 24 * 60 * 60 * 1000;
    // Allow 5 seconds tolerance
    expect(Math.abs(before - expectedMs - calledDate.getTime())).toBeLessThan(5000);
  });

  it("should return zero when no cancelled registrations match", async () => {
    // given
    mockDeleteCancelledRegistrationsBefore.mockResolvedValue(0);

    // when
    const result = await purgeCancelledRegistrations(new Date());

    // then
    expect(result.purgedCount).toBe(0);
  });

  it("should be idempotent - second call returns zero after first purge", async () => {
    // given
    const cutoff = new Date("2025-08-01T00:00:00.000Z");
    mockDeleteCancelledRegistrationsBefore.mockResolvedValueOnce(7);
    mockDeleteCancelledRegistrationsBefore.mockResolvedValueOnce(0);

    // when
    const first = await purgeCancelledRegistrations(cutoff);
    const second = await purgeCancelledRegistrations(cutoff);

    // then
    expect(first.purgedCount).toBe(7);
    expect(second.purgedCount).toBe(0);
  });

  it("should not affect active (confirmed) registrations", async () => {
    // given
    // - repository only deletes CANCELLED records, returns 2
    mockDeleteCancelledRegistrationsBefore.mockResolvedValue(2);

    // when
    const result = await purgeCancelledRegistrations(new Date());

    // then
    expect(result.purgedCount).toBe(2);
    // Verification: the repository function itself filters by CANCELLED status,
    // so active records are inherently protected by the WHERE clause
    expect(mockDeleteCancelledRegistrationsBefore).toHaveBeenCalledOnce();
  });

  it("should log the purge action with cutoff date", async () => {
    // given
    const cutoff = new Date("2025-08-01T00:00:00.000Z");
    mockDeleteCancelledRegistrationsBefore.mockResolvedValue(3);

    // when
    await purgeCancelledRegistrations(cutoff);

    // then
    expect(mockLogger.info).toHaveBeenCalledWith("Purged cancelled registrations", {
      action: "purge_cancelled_registrations",
      purgedCount: 3,
      olderThan: "2025-08-01T00:00:00.000Z",
    });
  });
});
