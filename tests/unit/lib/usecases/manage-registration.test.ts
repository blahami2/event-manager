import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/app-errors";

// ── Mock dependencies ──

const mockFindByTokenHash = vi.hoisted(() => vi.fn());
const mockRevokeToken = vi.hoisted(() => vi.fn());
const mockRevokeAllTokensForRegistration = vi.hoisted(() => vi.fn());
const mockCreateToken = vi.hoisted(() => vi.fn());
const mockFindRegistrationById = vi.hoisted(() => vi.fn());
const mockUpdateRegistration = vi.hoisted(() => vi.fn());
const mockCancelRegistration = vi.hoisted(() => vi.fn());
const mockHashToken = vi.hoisted(() => vi.fn());
const mockGenerateToken = vi.hoisted(() => vi.fn());
const mockSendManageLink = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockMaskEmail = vi.hoisted(() => vi.fn());

vi.mock("@/repositories/token-repository", () => ({
  findByTokenHash: mockFindByTokenHash,
  revokeToken: mockRevokeToken,
  revokeAllTokensForRegistration: mockRevokeAllTokensForRegistration,
  createToken: mockCreateToken,
}));

vi.mock("@/repositories/registration-repository", () => ({
  findRegistrationById: mockFindRegistrationById,
  updateRegistration: mockUpdateRegistration,
  cancelRegistration: mockCancelRegistration,
}));

vi.mock("@/lib/token/capability-token", () => ({
  hashToken: mockHashToken,
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

const validTokenData = {
  id: "tok-1",
  registrationId: "reg-1",
  tokenHash: "hashed-token-abc123",
  expiresAt: new Date("2026-05-14T12:00:00.000Z"),
  isRevoked: false,
  createdAt: now,
};

const registrationData = {
  id: "reg-1",
  name: "Alice Johnson",
  email: "alice@example.com",
  stay: "FRI_SUN",
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegetarian",
  status: "CONFIRMED" as const,
  createdAt: now,
  updatedAt: now,
};

const validUpdateInput = {
  name: "Alice Updated",
  email: "alice@example.com",
  stay: "FRI_SAT",
  adultsCount: 3,
  childrenCount: 0,
  notes: "Vegan",
};

const updatedRegistration = {
  ...registrationData,
  name: "Alice Updated",
  stay: "FRI_SAT",
  adultsCount: 3,
  childrenCount: 0,
  notes: "Vegan",
  updatedAt: new Date("2026-02-13T13:00:00.000Z"),
};

const newTokenPair = {
  raw: "new-raw-token-xyz789",
  hash: "new-hashed-token-xyz789",
};

const newTokenData = {
  id: "tok-2",
  registrationId: "reg-1",
  tokenHash: "new-hashed-token-xyz789",
  expiresAt: new Date("2026-05-14T13:00:00.000Z"),
  isRevoked: false,
  createdAt: new Date("2026-02-13T13:00:00.000Z"),
};

// ── Helpers ──

function setupTokenLookupMocks(): void {
  mockHashToken.mockReturnValue("hashed-token-abc123");
  mockFindByTokenHash.mockResolvedValue(validTokenData);
  mockFindRegistrationById.mockResolvedValue(registrationData);
  mockMaskEmail.mockReturnValue("a***@example.com");
}

function setupUpdateMocks(): void {
  setupTokenLookupMocks();
  mockUpdateRegistration.mockResolvedValue(updatedRegistration);
  mockRevokeToken.mockResolvedValue({ ...validTokenData, isRevoked: true });
  mockGenerateToken.mockReturnValue(newTokenPair);
  mockCreateToken.mockResolvedValue(newTokenData);
  mockSendManageLink.mockResolvedValue({ success: true });
}

// ── Tests ──

describe("getRegistrationByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should hash token, look up, and return registration data", async () => {
    setupTokenLookupMocks();

    const { getRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    const result = await getRegistrationByToken("raw-token-abc123");

    expect(mockHashToken).toHaveBeenCalledWith("raw-token-abc123");
    expect(mockFindByTokenHash).toHaveBeenCalledWith("hashed-token-abc123");
    expect(mockFindRegistrationById).toHaveBeenCalledWith("reg-1");
    expect(result).toEqual(registrationData);
  });

  it("should throw NotFoundError when token is not found (invalid)", async () => {
    mockHashToken.mockReturnValue("hashed-unknown");
    mockFindByTokenHash.mockResolvedValue(null);

    const { getRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(getRegistrationByToken("unknown-token")).rejects.toThrow(NotFoundError);
    expect(mockFindRegistrationById).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when token is expired (findByTokenHash returns null)", async () => {
    mockHashToken.mockReturnValue("hashed-expired");
    mockFindByTokenHash.mockResolvedValue(null);

    const { getRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(getRegistrationByToken("expired-token")).rejects.toThrow(NotFoundError);
    expect(mockFindRegistrationById).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError with generic message "Link not found or expired"', async () => {
    mockHashToken.mockReturnValue("hashed-any");
    mockFindByTokenHash.mockResolvedValue(null);

    const { getRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(getRegistrationByToken("any-token")).rejects.toThrow("Link not found or expired");
  });

  it("should throw NotFoundError when registration is not found (defensive)", async () => {
    mockHashToken.mockReturnValue("hashed-token-abc123");
    mockFindByTokenHash.mockResolvedValue(validTokenData);
    mockFindRegistrationById.mockResolvedValue(null);

    const { getRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(getRegistrationByToken("raw-token-abc123")).rejects.toThrow(NotFoundError);
    await expect(getRegistrationByToken("raw-token-abc123")).rejects.toThrow("Link not found or expired");
  });
});

describe("updateRegistrationByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should validate input, update registration, rotate token, send email, and return new manage URL", async () => {
    setupUpdateMocks();

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    const result = await updateRegistrationByToken("raw-token-abc123", validUpdateInput);

    expect(mockHashToken).toHaveBeenCalledWith("raw-token-abc123");
    expect(mockFindByTokenHash).toHaveBeenCalledWith("hashed-token-abc123");
    expect(mockUpdateRegistration).toHaveBeenCalledWith("reg-1", {
      name: "Alice Updated",
      email: "alice@example.com",
      stay: "FRI_SAT",
      adultsCount: 3,
      childrenCount: 0,
      notes: "Vegan",
    });
    expect(result).toEqual({
      newManageUrl: "https://example.com/manage/new-raw-token-xyz789",
    });
  });

  it("should revoke old token and create new token on update (token rotation)", async () => {
    setupUpdateMocks();

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await updateRegistrationByToken("raw-token-abc123", validUpdateInput);

    expect(mockRevokeToken).toHaveBeenCalledWith("tok-1");
    expect(mockGenerateToken).toHaveBeenCalledOnce();
    expect(mockCreateToken).toHaveBeenCalledWith("reg-1", "new-hashed-token-xyz789", expect.any(Date));
  });

  it("should throw NotFoundError when token is not found", async () => {
    mockHashToken.mockReturnValue("hashed-unknown");
    mockFindByTokenHash.mockResolvedValue(null);

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(updateRegistrationByToken("unknown-token", validUpdateInput)).rejects.toThrow(NotFoundError);
    await expect(updateRegistrationByToken("unknown-token", validUpdateInput)).rejects.toThrow("Link not found or expired");
    expect(mockUpdateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when update data is invalid", async () => {
    setupTokenLookupMocks();
    const invalidData = { ...validUpdateInput, name: "" };

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(updateRegistrationByToken("raw-token-abc123", invalidData)).rejects.toThrow(ValidationError);
    expect(mockUpdateRegistration).not.toHaveBeenCalled();
  });

  it("should send email with new manage URL after update", async () => {
    setupUpdateMocks();

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await updateRegistrationByToken("raw-token-abc123", validUpdateInput);

    expect(mockSendManageLink).toHaveBeenCalledOnce();
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        manageUrl: "https://example.com/manage/new-raw-token-xyz789",
        guestName: "Alice Updated",
        registrationId: "reg-1",
        emailType: "manage-link",
      }),
    );
  });

  it("should build new manage URL with BASE_URL and new raw token", async () => {
    vi.stubEnv("BASE_URL", "https://my-party.com");
    setupUpdateMocks();

    const { updateRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    const result = await updateRegistrationByToken("raw-token-abc123", validUpdateInput);

    expect(result.newManageUrl).toBe("https://my-party.com/manage/new-raw-token-xyz789");
  });
});

describe("cancelRegistrationByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should cancel registration and revoke all tokens", async () => {
    setupTokenLookupMocks();
    mockCancelRegistration.mockResolvedValue({ ...registrationData, status: "CANCELLED" });
    mockRevokeAllTokensForRegistration.mockResolvedValue(2);

    const { cancelRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await cancelRegistrationByToken("raw-token-abc123");

    expect(mockHashToken).toHaveBeenCalledWith("raw-token-abc123");
    expect(mockCancelRegistration).toHaveBeenCalledWith("reg-1");
    expect(mockRevokeAllTokensForRegistration).toHaveBeenCalledWith("reg-1");
  });

  it("should throw NotFoundError when token is not found", async () => {
    mockHashToken.mockReturnValue("hashed-unknown");
    mockFindByTokenHash.mockResolvedValue(null);

    const { cancelRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await expect(cancelRegistrationByToken("unknown-token")).rejects.toThrow(NotFoundError);
    await expect(cancelRegistrationByToken("unknown-token")).rejects.toThrow("Link not found or expired");
    expect(mockCancelRegistration).not.toHaveBeenCalled();
    expect(mockRevokeAllTokensForRegistration).not.toHaveBeenCalled();
  });

  it("should log the cancellation", async () => {
    setupTokenLookupMocks();
    mockCancelRegistration.mockResolvedValue({ ...registrationData, status: "CANCELLED" });
    mockRevokeAllTokensForRegistration.mockResolvedValue(1);

    const { cancelRegistrationByToken } = await import("@/lib/usecases/manage-registration");
    await cancelRegistrationByToken("raw-token-abc123");

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Registration cancelled",
      expect.objectContaining({ registrationId: "reg-1" }),
    );
  });
});
