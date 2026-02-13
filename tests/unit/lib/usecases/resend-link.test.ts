import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationStatus } from "@/types/registration";

// ── Mock dependencies ──

const mockFindRegistrationByEmail = vi.hoisted(() => vi.fn());
const mockRevokeAllTokensForRegistration = vi.hoisted(() => vi.fn());
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
  revokeAllTokensForRegistration: mockRevokeAllTokensForRegistration,
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
  guestCount: 2,
  dietaryNotes: "Vegetarian",
  status: RegistrationStatus.CONFIRMED,
  createdAt: now,
  updatedAt: now,
};

const cancelledRegistration = {
  id: "reg-2",
  name: "Bob Smith",
  email: "bob@example.com",
  guestCount: 1,
  dietaryNotes: null,
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
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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
    expect(mockRevokeAllTokensForRegistration).toHaveBeenCalledWith("reg-1");
    expect(mockGenerateToken).toHaveBeenCalledOnce();
    expect(mockCreateToken).toHaveBeenCalledWith(
      "reg-1",
      "new-hashed-token-abc123",
      expect.any(Date),
    );
    expect(mockSendManageLink).toHaveBeenCalledWith({
      to: "alice@example.com",
      manageUrl: "https://example.com/manage/new-raw-token-abc123",
      guestName: "Alice Johnson",
    });
    expect(result).toEqual({ success: true });
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
    expect(mockRevokeAllTokensForRegistration).not.toHaveBeenCalled();
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
    expect(mockRevokeAllTokensForRegistration).not.toHaveBeenCalled();
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
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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

  it("should always return { success: true } regardless of email existence", async () => {
    // given
    // - first call: email exists (confirmed)
    mockFindRegistrationByEmail.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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
