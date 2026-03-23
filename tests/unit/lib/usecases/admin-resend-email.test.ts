import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, AppError } from "@/lib/errors/app-errors";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// ── Mock dependencies ──

const mockFindRegistrationById = vi.hoisted(() => vi.fn());
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
  findRegistrationById: mockFindRegistrationById,
  listRegistrations: vi.fn(),
  cancelRegistration: vi.fn(),
  updateRegistration: vi.fn(),
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
    const result = await adminResendEmail("reg-1", adminId);

    // then
    expect(result).toEqual({ success: true });
    expect(mockFindRegistrationById).toHaveBeenCalledWith("reg-1");
    expect(mockRevokeAllTokensForRegistration).toHaveBeenCalledWith("reg-1");
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
        stay: StayOption.FRI_SUN,
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    // given
    // - no registration found
    mockFindRegistrationById.mockResolvedValue(null);

    // when / then
    await expect(adminResendEmail("nonexistent-id", adminId)).rejects.toThrow(NotFoundError);
    expect(mockRevokeAllTokensForRegistration).not.toHaveBeenCalled();
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
    expect(mockRevokeAllTokensForRegistration).not.toHaveBeenCalled();
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockSendManageLink).not.toHaveBeenCalled();
  });

  it("should propagate error when email sending fails", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
    mockGenerateToken.mockReturnValue(tokenPair);
    mockCreateToken.mockResolvedValue(createdTokenData);
    // - email sending fails
    mockSendManageLink.mockResolvedValue({ success: false, error: "Resend API error" });

    // when
    const result = await adminResendEmail("reg-1", adminId);

    // then
    expect(result).toEqual({ success: false, error: "Resend API error" });
  });

  it("should log admin action with adminUserId, action, and targetId with masked email", async () => {
    // given
    // - confirmed registration exists
    mockFindRegistrationById.mockResolvedValue(confirmedRegistration);
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);
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
