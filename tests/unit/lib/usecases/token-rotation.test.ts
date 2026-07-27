import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ──

const mockRevokeToken = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/repositories/token-repository", () => ({
  revokeToken: mockRevokeToken,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

// ── Import SUT (after mocks) ──

import { discardUndeliveredToken } from "@/lib/usecases/token-rotation";

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──

/**
 * Every path that mails a guest a new manage link creates the replacement token
 * before sending, so that a failed send cannot cost the guest their working
 * link. This is the other half of that bargain: the token created for an email
 * that never went out has to be cleaned up — without ever becoming the reason
 * the caller's own error goes unreported.
 */
describe("discardUndeliveredToken", () => {
  it("should revoke the undelivered token", async () => {
    // given
    mockRevokeToken.mockResolvedValue({ id: "tok-new", isRevoked: true });

    // when
    await discardUndeliveredToken("tok-new", "reg-1");

    // then
    expect(mockRevokeToken).toHaveBeenCalledWith("tok-new");
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should not throw when the revoke fails", async () => {
    // given
    // - the cleanup runs during a failure, often the same outage that caused it
    mockRevokeToken.mockRejectedValue(new Error("connection pool exhausted"));

    // when / then
    await expect(discardUndeliveredToken("tok-new", "reg-1")).resolves.toBeUndefined();
  });

  it("should log the reason when the revoke fails", async () => {
    // given
    mockRevokeToken.mockRejectedValue(new Error("connection pool exhausted"));

    // when
    await discardUndeliveredToken("tok-new", "reg-1");

    // then
    // - swallowed for the caller, but never silent for the operator
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to revoke undelivered token",
      { registrationId: "reg-1", error: "connection pool exhausted" },
    );
  });

  it("should log a placeholder reason when the rejection is not an Error", async () => {
    // given
    // - a non-Error rejection has no `.message` to read
    mockRevokeToken.mockRejectedValue("something odd");

    // when
    await discardUndeliveredToken("tok-new", "reg-1");

    // then
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to revoke undelivered token",
      { registrationId: "reg-1", error: "unknown" },
    );
  });

  it("should not log the token id", async () => {
    // given
    // - token identifiers stay out of logs (S4, LOG3); the registration is
    //   enough to correlate the failure
    mockRevokeToken.mockRejectedValue(new Error("boom"));

    // when
    await discardUndeliveredToken("tok-secret", "reg-1");

    // then
    const logged = JSON.stringify(mockLogger.error.mock.calls[0]);
    expect(logged).not.toContain("tok-secret");
  });
});
