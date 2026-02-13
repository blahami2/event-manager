import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidationError } from "@/lib/errors/app-errors";

// ── Mock dependencies ──

const mockCreateRegistration = vi.hoisted(() => vi.fn());
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
  createRegistration: mockCreateRegistration,
}));

vi.mock("@/repositories/token-repository", () => ({
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

const validInput = {
  name: "Alice Johnson",
  email: "alice@example.com",
  guestCount: 2,
  dietaryNotes: "Vegetarian",
};

const createdRegistration = {
  id: "reg-1",
  name: "Alice Johnson",
  email: "alice@example.com",
  guestCount: 2,
  dietaryNotes: "Vegetarian",
  status: "CONFIRMED" as const,
  createdAt: now,
  updatedAt: now,
};

const tokenPair = {
  raw: "raw-token-abc123",
  hash: "hashed-token-abc123",
};

const tokenData = {
  id: "tok-1",
  registrationId: "reg-1",
  tokenHash: "hashed-token-abc123",
  expiresAt: new Date("2026-05-14T12:00:00.000Z"),
  isRevoked: false,
  createdAt: now,
};

// ── Helpers ──

function setupSuccessMocks(): void {
  mockCreateRegistration.mockResolvedValue(createdRegistration);
  mockGenerateToken.mockReturnValue(tokenPair);
  mockCreateToken.mockResolvedValue(tokenData);
  mockSendManageLink.mockResolvedValue({ success: true });
  mockMaskEmail.mockReturnValue("a***@example.com");
}

// ── Tests ──

describe("registerGuest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should create registration, generate token, store hash, send email, and return registrationId", async () => {
    // given
    // - successful mocks for all dependencies
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    const result = await registerGuest(validInput);

    // then
    expect(mockCreateRegistration).toHaveBeenCalledOnce();
    expect(mockCreateRegistration).toHaveBeenCalledWith({
      name: "Alice Johnson",
      email: "alice@example.com",
      guestCount: 2,
      dietaryNotes: "Vegetarian",
    });

    expect(mockGenerateToken).toHaveBeenCalledOnce();

    expect(mockCreateToken).toHaveBeenCalledOnce();
    expect(mockCreateToken).toHaveBeenCalledWith(
      "reg-1",
      "hashed-token-abc123",
      expect.any(Date),
    );

    expect(mockSendManageLink).toHaveBeenCalledOnce();
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        manageUrl: "https://example.com/manage/raw-token-abc123",
        guestName: "Alice Johnson",
        registrationId: "reg-1",
        emailType: "manage-link",
        eventName: "Birthday Celebration",
        eventDate: "Saturday, March 28, 2026",
      }),
    );

    expect(result).toEqual({ registrationId: "reg-1" });
  });

  it("should not return raw token in the result", async () => {
    // given
    // - successful mocks for all dependencies
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    const result = await registerGuest(validInput);

    // then
    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("raw");
    expect(result).not.toHaveProperty("hash");
    expect(result).not.toHaveProperty("manageUrl");
    expect(Object.keys(result)).toEqual(["registrationId"]);
  });

  it("should build manage URL with BASE_URL and raw token", async () => {
    // given
    // - specific BASE_URL configured
    vi.stubEnv("BASE_URL", "https://my-party.com");
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    await registerGuest(validInput);

    // then
    expect(mockSendManageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        manageUrl: "https://my-party.com/manage/raw-token-abc123",
      }),
    );
  });

  it("should log registration creation with masked email", async () => {
    // given
    // - successful mocks for all dependencies
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    await registerGuest(validInput);

    // then
    expect(mockMaskEmail).toHaveBeenCalledWith("alice@example.com");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Registration created",
      expect.objectContaining({
        registrationId: "reg-1",
        email: "a***@example.com",
      }),
    );
  });

  it("should calculate token expiry based on TOKEN_EXPIRY_DAYS", async () => {
    // given
    // - successful mocks for all dependencies
    setupSuccessMocks();
    const beforeCall = new Date();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    await registerGuest(validInput);

    // then
    const callArgs = mockCreateToken.mock.calls[0] as unknown[];
    const expiresAt = callArgs[2] as Date;
    const afterCall = new Date();
    const minExpiry = new Date(beforeCall.getTime() + 90 * 24 * 60 * 60 * 1000);
    const maxExpiry = new Date(afterCall.getTime() + 90 * 24 * 60 * 60 * 1000);
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpiry.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpiry.getTime());
  });

  it("should succeed when dietaryNotes is omitted (optional field)", async () => {
    // given
    // - input without dietaryNotes
    const inputWithoutNotes = {
      name: "Bob Smith",
      email: "bob@example.com",
      guestCount: 1,
    };
    setupSuccessMocks();
    mockCreateRegistration.mockResolvedValue({
      ...createdRegistration,
      id: "reg-2",
      name: "Bob Smith",
      email: "bob@example.com",
      guestCount: 1,
      dietaryNotes: null,
    });

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    const result = await registerGuest(inputWithoutNotes);

    // then
    expect(result).toEqual({ registrationId: "reg-2" });
    expect(mockCreateRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bob Smith",
        email: "bob@example.com",
        guestCount: 1,
      }),
    );
  });

  it("should allow re-registration with duplicate email", async () => {
    // given
    // - createRegistration succeeds even for duplicate email
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    const result = await registerGuest(validInput);

    // then
    expect(result).toEqual({ registrationId: "reg-1" });
    expect(mockCreateRegistration).toHaveBeenCalledOnce();
  });
});

describe("registerGuest validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BASE_URL", "https://example.com");
  });

  it("should throw ValidationError when name is empty", async () => {
    // given
    // - input with empty name
    const input = { ...validInput, name: "" };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when name exceeds 200 characters", async () => {
    // given
    // - input with name exceeding 200 characters
    const input = { ...validInput, name: "A".repeat(201) };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when email is invalid", async () => {
    // given
    // - input with invalid email
    const input = { ...validInput, email: "not-an-email" };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ email: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when guestCount is less than 1", async () => {
    // given
    // - input with guestCount 0
    const input = { ...validInput, guestCount: 0 };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ guestCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when guestCount is greater than 10", async () => {
    // given
    // - input with guestCount 11
    const input = { ...validInput, guestCount: 11 };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ guestCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when guestCount is not an integer", async () => {
    // given
    // - input with non-integer guestCount
    const input = { ...validInput, guestCount: 2.5 };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ guestCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when dietaryNotes exceeds 500 characters", async () => {
    // given
    // - input with dietaryNotes exceeding 500 characters
    const input = { ...validInput, dietaryNotes: "N".repeat(501) };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ dietaryNotes: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should include field-level error details in ValidationError", async () => {
    // given
    // - input with multiple invalid fields
    const input = { name: "", email: "bad", guestCount: 0 };

    // when
    const { registerGuest } = await import("@/lib/usecases/register");

    // then
    try {
      await registerGuest(input);
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.message).toBe("Validation failed");
      expect(validationError.fields).toBeDefined();
      expect(typeof validationError.fields).toBe("object");
      expect(Object.keys(validationError.fields).length).toBeGreaterThan(0);
    }
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });
});
