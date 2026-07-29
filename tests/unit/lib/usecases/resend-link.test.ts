import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationStatus } from "@/types/registration";

// ── Mock dependencies ──

const mockFindRegistrationByEmail = vi.hoisted(() => vi.fn());
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
  findRegistrationByEmail: mockFindRegistrationByEmail,
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

// ── Fixtures ──

const now = new Date("2026-02-13T12:00:00.000Z");

const confirmedRegistration = {
  id: "reg-1",
  name: "Alice Johnson",
  email: "alice@example.com",
  stay: "FRI_SUN",
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegetarian",
  status: RegistrationStatus.CONFIRMED,
  createdAt: now,
  updatedAt: now,
};

/**
 * A registration whose dates an administrator pinned by hand. The public
 * resend-link flow must carry that range into the .ics attachment; forwarding
 * only `stay` would mail the guest an invite for the predefined weekend and
 * overwrite the correct entry in their calendar.
 */
const customRangeRegistration = {
  ...confirmedRegistration,
  stay: "SAT_SUN",
  stayStartDate: "2026-07-10",
  stayEndDate: "2026-07-17",
};

const cancelledRegistration = {
  id: "reg-2",
  name: "Bob Smith",
  email: "bob@example.com",
  stay: "FRI_SAT",
  adultsCount: 1,
  childrenCount: 0,
  notes: null,
  status: RegistrationStatus.CANCELLED,
  createdAt: now,
  updatedAt: now,
};

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

/**
 * Import the use case after the module mocks are in place and run it against
 * the confirmed fixture's email.
 */
async function resendManageLinkFn(): Promise<{ readonly success: true }> {
  const { resendManageLink } = await import("@/lib/usecases/resend-link");
  return resendManageLink("alice@example.com");
}

// ── Tests ──

describe("resendManageLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should look up registration by email, revoke old tokens, generate new token, send email, and return success", async () => {
    // given
    // - confirmed registration exists for the email
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    // - old tokens are revoked successfully
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
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    const result = await resendManageLink("alice@example.com");

    // then
    expect(mockFindRegistrationByEmail).toHaveBeenCalledWith(
      "alice@example.com",
    );
    expect(mockRevokeAllTokensForRegistrationExcept).toHaveBeenCalledWith("reg-1", "tok-1");
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
        stayDates: expect.objectContaining({ stay: "FRI_SUN" }),
      }),
    );
    // eventName and eventDate should NOT be passed - they are resolved from i18n
    const sendCall = mockSendManageLink.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sendCall).not.toHaveProperty("eventName");
    expect(sendCall).not.toHaveProperty("eventDate");
    expect(result).toEqual({ success: true });
  });

  it("should forward an admin-set custom date range to the email service", async () => {
    // given
    // - a confirmed registration carrying an admin-pinned range
    mockFindRegistrationByEmail.mockResolvedValue(customRangeRegistration);
    mockGenerateToken.mockReturnValue({
      raw: "new-raw-token-abc123",
      hash: "new-hashed-token-abc123",
    });
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const { resendManageLink } = await import("@/lib/usecases/resend-link");
    await resendManageLink("alice@example.com");

    // then
    // - the .ics must describe the pinned range, not the SAT_SUN defaults
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        stayDates: expect.objectContaining({
          stay: "SAT_SUN",
          stayStartDate: "2026-07-10",
          stayEndDate: "2026-07-17",
        }),
      }),
    );
  });

  it("should return success without sending email when email is not found", async () => {
    // given
    // - no registration exists for the email
    mockFindRegistrationByEmail.mockResolvedValue(null);

    // when
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    const result = await resendManageLink("unknown@example.com");

    // then
    expect(mockFindRegistrationByEmail).toHaveBeenCalledWith(
      "unknown@example.com",
    );
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();
    expect(mockSendManageLink).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("should return success without generating token when registration is cancelled", async () => {
    // given
    // - cancelled registration exists for the email
    mockFindRegistrationByEmail.mockResolvedValue(cancelledRegistration);

    // when
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    const result = await resendManageLink("bob@example.com");

    // then
    expect(mockFindRegistrationByEmail).toHaveBeenCalledWith(
      "bob@example.com",
    );
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();
    expect(mockSendManageLink).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("should build manage URL with BASE_URL and raw token", async () => {
    // given
    // - specific BASE_URL configured
    vi.stubEnv("BASE_URL", "https://my-party.com");
    // - confirmed registration exists
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    await resendManageLink("alice@example.com");

    // then
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        manageUrl: "https://my-party.com/manage/new-raw-token-abc123",
      }),
    );
  });

  it("should log with masked email when email is found", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    await resendManageLink("alice@example.com");

    // then
    expect(mockMaskEmail).toHaveBeenCalledWith("alice@example.com");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Manage link resent",
      expect.objectContaining({
        registrationId: "reg-1",
        email: "a***@example.com",
      }),
    );
  });

  it("should not log when email is not found", async () => {
    // given
    // - no registration exists
    mockFindRegistrationByEmail.mockResolvedValue(null);

    // when
    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    await resendManageLink("unknown@example.com");

    // then
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  /**
   * The guest-facing path: the only thing this flow can give a locked-out guest
   * is a working link. Revoking before the send meant a provider outage took the
   * guest's *existing* link with it — the request that was supposed to restore
   * access removed it instead — while the log still recorded a resend.
   *
   * The public result must not change: an identical `{ success: true }` for every
   * outcome is what keeps the endpoint from confirming which emails exist (S5).
   */
  it("should leave the existing tokens valid when the email fails to send", async () => {
    // given
    // - a confirmed registration whose guest is asking for a fresh link
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    // - the email provider rejects the send
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const result = await resendManageLinkFn();

    // then
    // - the link the guest may still have keeps working
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    // - the undelivered token is not left live
    expect(mockRevokeToken).toHaveBeenCalledWith("tok-1");
    // - and the caller still cannot tell the email existed
    expect(result).toEqual({ success: true });
  });

  it("should not record a successful resend when the email fails to send", async () => {
    // given
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    await resendManageLinkFn();

    // then
    // - operators must be able to tell a delivered link from a dropped one
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      "Manage link resent",
      expect.anything(),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Manage link resend failed",
      expect.objectContaining({
        registrationId: "reg-1",
        email: "a***@example.com",
      }),
    );
  });

  it("should leave the existing tokens valid when the send path throws", async () => {
    // given
    // - an unexpected failure inside the email path, not a returned result
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockRejectedValue(new Error("network down"));
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when / then
    await expect(resendManageLinkFn()).rejects.toThrow("network down");
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
    expect(mockRevokeToken).toHaveBeenCalledWith("tok-1");
  });

  it("should still return the anti-enumeration result when discarding the undelivered token fails", async () => {
    // given
    // - the send failed and the database is unreachable for the cleanup too;
    //   neither may change what the caller observes (S5)
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });
    mockRevokeToken.mockRejectedValue(new Error("connection pool exhausted"));
    mockMaskEmail.mockReturnValue("a***@example.com");

    // when
    const result = await resendManageLinkFn();

    // then
    expect(result).toEqual({ success: true });
    expect(mockRevokeAllTokensForRegistrationExcept).not.toHaveBeenCalled();
  });

  it("should create the replacement token before attempting the send", async () => {
    // given
    // - ordering is the whole guarantee: the guest's current link stays usable
    //   until a replacement has actually been delivered
    const callOrder: string[] = [];
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
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
    await resendManageLinkFn();

    // then
    expect(callOrder).toEqual([
      "createToken",
      "sendManageLink",
      "revokeAllTokensForRegistrationExcept",
    ]);
  });

  it("should always return { success: true } regardless of email existence", async () => {
    // given
    // - first call: email exists (confirmed)
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistrationExcept.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    mockSendManageLink.mockResolvedValue({ success: true });
    mockMaskEmail.mockReturnValue("a***@example.com");

    const { resendManageLink } = await import(
      "@/lib/usecases/resend-link"
    );
    const resultExisting = await resendManageLink("alice@example.com");

    // - second call: email does not exist
    vi.clearAllMocks();
    mockFindRegistrationByEmail.mockResolvedValue(null);

    // when
    const resultMissing = await resendManageLink("unknown@example.com");

    // then
    expect(resultExisting).toEqual({ success: true });
    expect(resultMissing).toEqual({ success: true });
    expect(resultExisting).toEqual(resultMissing);
  });
});
