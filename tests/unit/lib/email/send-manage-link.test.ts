import { describe, test, expect, vi, beforeEach } from "vitest";

const TEST_REGISTRATION_ID = "00000000-0000-0000-0000-000000000001";

const { mockSend, mockLoggerInfo, mockLoggerError, mockRenderManageLinkEmail } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
  mockRenderManageLinkEmail: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    debug: vi.fn(),
    warn: vi.fn(),
  },
  maskEmail: (email: string) => {
    const at = email.indexOf("@");
    if (at < 0) return "***";
    return `${email.charAt(0)}***${email.substring(at)}`;
  },
}));

vi.mock("@/lib/email/templates/manage-link-template", () => ({
  renderManageLinkEmail: mockRenderManageLinkEmail,
}));

import { sendManageLink } from "@/lib/email/send-manage-link";
import { StayOption } from "@/types/registration";

describe("sendManageLink", () => {
  const baseParams = {
    to: "alice@example.com",
    manageUrl: "https://example.com/manage/test-token-12345678",
    guestName: "Alice Johnson",
    registrationId: TEST_REGISTRATION_ID,
    emailType: "manage-link" as const,
    eventName: "Triple Threat",
    eventDate: "2026-03-15",
    stay: StayOption.FRI_SUN,
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["RESEND_API_KEY"] = "re_test_key";
    mockRenderManageLinkEmail.mockResolvedValue({
      subject: "Your Registration Manage Link",
      html: "<p>rendered email</p>",
    });
  });

  test("should return success true when Resend API sends successfully", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    // when
    const result = await sendManageLink(baseParams);

    // then
    expect(result).toEqual({ success: true });
  });

  test("should call renderManageLinkEmail with correct params", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    // when
    await sendManageLink(baseParams);

    // then
    expect(mockRenderManageLinkEmail).toHaveBeenCalledWith({
      guestName: "Alice Johnson",
      eventName: "Triple Threat",
      eventDate: "2026-03-15",
      manageUrl: "https://example.com/manage/test-token-12345678",
      locale: undefined,
    });
  });

  test("should pass locale to renderManageLinkEmail when provided", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    // when
    await sendManageLink({ ...baseParams, locale: "cs" });

    // then
    expect(mockRenderManageLinkEmail).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "cs" }),
    );
  });

  test("should call Resend API with rendered subject and html", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });
    mockRenderManageLinkEmail.mockResolvedValue({
      subject: "Translated Subject",
      html: "<p>translated html</p>",
    });

    // when
    await sendManageLink(baseParams);

    // then
    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs["to"]).toBe("alice@example.com");
    expect(callArgs["subject"]).toBe("Translated Subject");
    expect(callArgs["html"]).toBe("<p>translated html</p>");
  });

  test("should return success false with error message when Resend API fails", async () => {
    // given
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Rate limit exceeded", name: "rate_limit" },
    });

    // when
    const result = await sendManageLink(baseParams);

    // then
    expect(result).toEqual({ success: false, error: "Rate limit exceeded" });
  });

  test("should return success false when RESEND_API_KEY is missing", async () => {
    // given
    delete process.env["RESEND_API_KEY"];

    // when
    const result = await sendManageLink(baseParams);

    // then
    expect(result).toEqual({
      success: false,
      error: "Missing RESEND_API_KEY environment variable.",
    });
  });

  test("should log email send with registrationId, emailType, and masked email on success", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    // when
    await sendManageLink(baseParams);

    // then
    expect(mockLoggerInfo).toHaveBeenCalledWith("Email sent", {
      registrationId: TEST_REGISTRATION_ID,
      emailType: "manage-link",
      to: "a***@example.com",
    });
  });

  test("should log error with registrationId, emailType, and masked email on failure", async () => {
    // given
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Service unavailable", name: "server_error" },
    });

    // when
    await sendManageLink(baseParams);

    // then
    expect(mockLoggerError).toHaveBeenCalledWith("Email send failed", {
      registrationId: TEST_REGISTRATION_ID,
      emailType: "manage-link",
      to: "a***@example.com",
      error: "Service unavailable",
    });
  });

  test("should never log unmasked recipient email", async () => {
    // given
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    // when
    await sendManageLink(baseParams);

    // then
    const allCalls = [...mockLoggerInfo.mock.calls, ...mockLoggerError.mock.calls];
    const serialized = JSON.stringify(allCalls);
    expect(serialized).not.toContain("alice@example.com");
  });
});
