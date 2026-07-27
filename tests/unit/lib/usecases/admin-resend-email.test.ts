import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, AppError } from "@/lib/errors/app-errors";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// ── Mock dependencies ──

const mockFindRegistrationById = vi.hoisted(() => vi.fn());
const mockRevokeAllTokensForRegistrationExcept = vi.hoisted(() => vi.fn());
const mockRevokeToken = vi.hoisted(() => vi.fn());
const mockCreateToken = vi.hoisted(() => vi.fn());
const mockGenerateToken = vi.hoisted(() => vi.fn());
const mockSendManageLink = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockMaskEmail = vi.hoisted(() => vi.fn());

vi.mock("@/repositories/registration-repository", () => ({
  findRegistrationById: mockFindRegistrationById,
  listRegistrations: vi.fn(),
  cancelRegistration: vi.fn(),
  updateRegistration: vi.fn(),
}));

vi.mock("@/repositories/token-repository", () => ({
  revokeAllTokensForRegistrationExcept: mockRevokeAllTokensForRegistrationExcept,
  revokeToken: mockRevokeToken,
  createToken: mockCreateToken,
}));

vi.mock("@/lib/token/capability-token", () => ({
  generateToken: mockGenerateToken,
}));

vi.mock("@/lib/email/send-manage-link", () => ({
  sendManageLink: mockSendManageLink,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
  maskEmail: mockMaskEmail,
}));

vi.mock("@/lib/usecases/data-retention", () => ({
  purgeExpiredTokens: vi.fn(),
  purgeCancelledRegistrations: vi.fn(),
}));

// ── Fixtures ──

const now = new Date("2026-02-13T12:00:00.000Z");

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
    id: "reg-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    stay: StayOption.FRI_SUN,
    accommodation: AccommodationOption.ANYWHERE,
    adultsCount: 2,
    childrenCount: 0,
    notes: null,
    stayStartDate: null,
    stayEndDate: null,
    status: RegistrationStatus.CONFIRMED,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const confirmedRegistration = makeRegistration();
const cancelledRegistration = makeRegistration({
  id: "reg-3",
  name: "Carol Davis",
  email: "carol@example.com",
  stay: StayOption.SAT_SUN,
  stayStartDate: null,
  stayEndDate: null,
  status: RegistrationStatus.CANCELLED,
});

const tokenPair = {
  raw: "new-raw-token-abc123",
  hash: "new-hashed-token-abc123",
};

const createdTokenData = {
  id: "tok-1",
  registrationId: "reg-1",
  tokenHash: "new-hashed-token-abc123",
  expiresAt: new Date("2026-05-14T12:00:00.000Z"),
  isRevoked: false,
  createdAt: now,
};

const adminId = "admin-user-001";

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BASE_URL", "https://example.com");
});

// ── Import SUT (after mocks) ──

import { adminResendEmail } from "@/lib/usecases/admin-actions";

// ── Tests ──

describe("adminResendEmail", () => {
  it("should revoke old tokens, generate new token, send email, and return success when registration is confirmed", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    // - superseded tokens are revoked successfully
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    // - new token is generated
    mockGenerateToken.mockReturnValue(tokenPair);
    // - new token is stored
    mockCreateToken.mockResolvedValue(createdTokenData);
    // - email is sent successfully
    mockSendManageLink.mockResolvedValue({ success: true });
    // - email masking works
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const result = await adminResendEmail("reg-1", adminId);

    // then
    expect(result).toEqual({ success: true });
    expect(mockFindRegistrationById).toHaveBeenCalledWith("reg-1");
    // - the delivered token supersedes every earlier one
    expect(mockRevokeAllTokensForRegistrationExcept).toHaveBeenCalledWith("reg-1", "tok-1");
    expect(mockRevokeToken).not.toHaveBeenCalled();
    expect(mockGenerateToken).toHaveBeenCalledOnce();
    expect(mockCreateToken).toHaveBeenCalledWith(
      "reg-1",
      "new-hashed-token-abc123",
      expect.any(Date),
    );
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        manageUrl: "https://example.com/manage/new-raw-token-abc123",
        guestName: "Alice Johnson",
        registrationId: "reg-1",
        emailType: "manage-link",
        stayDates: expect.objectContaining({ stay: StayOption.FRI_SUN }),
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    // given
    // - no registration found
    mockFindRegistrationById.mockResolvedValue(null);

    // when / then
    await expect(adminResendEmail("nonexistent-id", adminId)).rejects.toThrow(NotFoundError);
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockSendManageLink).not.toHaveBeenCalled();
  });

  it("should throw AppError with INVALID_STATUS code when registration is cancelled", async () => {
    // given
    // - cancelled registration exists
    mockFindRegistrationById.mockResolvedValue(cancelledRegistration);

    // when / then
    await expect(adminResendEmail("reg-3", adminId)).rejects.toThrow(AppError);
    await expect(adminResendEmail("reg-3", adminId)).rejects.toMatchObject({
      code: "INVALID_STATUS",
      statusCode: 400,
    });
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockSendManageLink).not.toHaveBeenCalled();
  });

  it("should propagate error when email sending fails", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    // - email sending fails
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });

    // when
    const result = await adminResendEmail("reg-1", adminId);

    // then
    expect(result).toEqual({ success: false, error: "Resend API error" });
  });

  /**
   * Rotation is the *consequence* of a delivered email, never a precondition of
   * attempting one. Revoking first meant a Resend outage — or any throw on the
   * send path — left the guest holding a dead link and no replacement, with no
   * way back short of an admin noticing and retrying.
   */
  it("should leave the existing tokens valid when the email fails to send", async () => {
    // given
    // - a confirmed registration whose guest holds a working manage link
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    // - the email provider rejects the send
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    await adminResendEmail("reg-1", adminId);

    // then
    // - nothing the guest already holds was revoked
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    // - and the undelivered token is not left live
    expect(mockRevokeToken).toHaveBeenCalledWith("tok-1");
  });

  it("should leave the existing tokens valid when the send path throws", async () => {
    // given
    // - an unexpected failure inside the email path, not a returned result
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockRejectedValue(new Error("network down"));
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when / then
    await expect(adminResendEmail("reg-1", adminId)).rejects.toThrow("network down");
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockRevokeToken).toHaveBeenCalledWith("tok-1");
  });

  /**
   * The compensating revoke runs precisely when something is already failing —
   * often the same outage. If it rejects unguarded it replaces the original
   * error, which is then never reported, and the caller learns nothing about
   * why the send failed.
   */
  it("should still report the send failure when discarding the undelivered token fails", async () => {
    // given
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });
    // - the database is unreachable too
    mockRevokeToken.mockRejectedValue(new Error("connection pool exhausted"));
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const result = await adminResendEmail("reg-1", adminId);

    // then
    expect(result).toEqual({ success: false, error: "Resend API error" });
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
  });

  it("should preserve the original error when discarding the undelivered token fails", async () => {
    // given
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockRejectedValue(new Error("network down"));
    mockRevokeToken.mockRejectedValue(new Error("connection pool exhausted"));
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when / then
    // - the send failure is the cause worth surfacing, not the cleanup failure
    await expect(adminResendEmail("reg-1", adminId)).rejects.toThrow("network down");
  });

  it("should create the replacement token before attempting the send", async () => {
    // given
    // - ordering is the whole guarantee: the old token stays usable until the
    //   new one has actually been delivered
    const callOrder: string[] = [];
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockImplementation(() => {
      callOrder.push("createToken");
      return Promise.resolve(createdTokenData);
    });
    mockSendManageLink.mockImplementation(() => {
      callOrder.push("sendManageLink");
      return Promise.resolve({ success: true });
    });
    mockRevokeAllTokensForRegistrationExcept.mockImplementation(() => {
      callOrder.push("revokeAllTokensForRegistrationExcept");
      return Promise.resolve(1);
    });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    await adminResendEmail("reg-1", adminId);

    // then
    expect(callOrder).toEqual([
      "createToken",
      "sendManageLink",
      "revokeAllTokensForRegistrationExcept",
    ]);
  });

  it("should log admin action with adminUserId, action, and targetId with masked email", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    await adminResendEmail("reg-1", adminId);

    // then
    expect(mockMaskEmail).toHaveBeenCalledWith("alice@example.com");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin resent registration email",
      expect.objectContaining({
        adminUserId: adminId,
        action: "resend_email",
        targetId: "reg-1",
        email: "a***@example.com",
      }),
    );
  });

  it("should construct manage URL using BASE_URL environment variable", async () => {
    // given
    vi.stubEnv("BASE_URL", "https://my-party.com");
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    await adminResendEmail("reg-1", adminId);

    // then
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        manageUrl: "https://my-party.com/manage/new-raw-token-abc123",
      }),
    );
  });
});
