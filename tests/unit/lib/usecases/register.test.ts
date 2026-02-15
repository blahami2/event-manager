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
  stay: "FRI_SUN",
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegetarian",
};

const createdRegistration = {
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
    setupSuccessMocks();

    // when
    const { registerGuest } = await import("@/lib/usecases/register");
    const result = await registerGuest(validInput);

    // then
    expect(mockCreateRegistration).toHaveBeenCalledOnce();
    expect(mockCreateRegistration).toHaveBeenCalledWith({
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: "FRI_SUN",
      adultsCount: 2,
      childrenCount: 1,
      notes: "Vegetarian",
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
        stay: "FRI_SUN",
      }),
    );
    // eventName and eventDate should NOT be passed - they are resolved from i18n
    const sendCall = mockSendManageLink.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sendCall).not.toHaveProperty("eventName");
    expect(sendCall).not.toHaveProperty("eventDate");

    expect(result).toEqual({ registrationId: "reg-1" });
  });

  it("should not return raw token in the result", async () => {
    // given
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

  it("should succeed when notes is omitted (optional field)", async () => {
    // given
    const inputWithoutNotes = {
      name: "Bob Smith",
      email: "bob@example.com",
      stay: "FRI_SAT",
      adultsCount: 1,
      childrenCount: 0,
    };
    setupSuccessMocks();
    mockCreateRegistration.mockResolvedValue({
      ...createdRegistration,
      id: "reg-2",
      name: "Bob Smith",
      email: "bob@example.com",
      stay: "FRI_SAT",
      adultsCount: 1,
      childrenCount: 0,
      notes: null,
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
        stay: "FRI_SAT",
        adultsCount: 1,
        childrenCount: 0,
      }),
    );
  });

  it("should allow re-registration with duplicate email", async () => {
    // given
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
    const input = { ...validInput, name: "" };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when name exceeds 200 characters", async () => {
    const input = { ...validInput, name: "A".repeat(201) };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when email is invalid", async () => {
    const input = { ...validInput, email: "not-an-email" };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ email: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when adultsCount is less than 1", async () => {
    const input = { ...validInput, adultsCount: 0 };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ adultsCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when adultsCount is greater than 10", async () => {
    const input = { ...validInput, adultsCount: 11 };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ adultsCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when adultsCount is not an integer", async () => {
    const input = { ...validInput, adultsCount: 2.5 };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ adultsCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when stay is invalid", async () => {
    const input = { ...validInput, stay: "INVALID" };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ stay: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when childrenCount is negative", async () => {
    const input = { ...validInput, childrenCount: -1 };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ childrenCount: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when notes exceeds 500 characters", async () => {
    const input = { ...validInput, notes: "N".repeat(501) };
    const { registerGuest } = await import("@/lib/usecases/register");
    await expect(registerGuest(input)).rejects.toThrow(ValidationError);
    await expect(registerGuest(input)).rejects.toMatchObject({
      fields: expect.objectContaining({ notes: expect.any(String) }),
    });
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should include field-level error details in ValidationError", async () => {
    const input = { name: "", email: "bad", stay: "INVALID", adultsCount: 0, childrenCount: -1 };
    const { registerGuest } = await import("@/lib/usecases/register");

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
