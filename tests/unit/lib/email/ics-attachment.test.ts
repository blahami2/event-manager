import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockSend, mockRenderManageLinkEmail } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockRenderManageLinkEmail: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
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

describe("ICS calendar attachment in registration email", () => {
  const baseParams = {
    to: "bob@example.com",
    manageUrl: "https://example.com/manage/test-token-12345678",
    guestName: "Bob Smith",
    registrationId: "00000000-0000-0000-0000-000000000002",
    emailType: "manage-link" as const,
    eventName: "Birthday Celebration",
    eventDate: "2026-03-28",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["RESEND_API_KEY"] = "re_test_key";
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });
    mockRenderManageLinkEmail.mockResolvedValue({
      subject: "Your Registration Manage Link",
      html: "<p>Hi Bob Smith,</p><p>A calendar invite is attached to this email.</p>",
    });
  });

  test("should include attachments array in Resend API call", async () => {
    await sendManageLink(baseParams);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs).toHaveProperty("attachments");
    expect(Array.isArray(callArgs["attachments"])).toBe(true);
  });

  test("should set attachment filename to 'event.ics'", async () => {
    await sendManageLink(baseParams);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    const attachments = callArgs["attachments"] as ReadonlyArray<Record<string, unknown>>;
    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.["filename"]).toBe("event.ics");
  });

  test("should set attachment contentType to 'text/calendar; method=REQUEST'", async () => {
    await sendManageLink(baseParams);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    const attachments = callArgs["attachments"] as ReadonlyArray<Record<string, unknown>>;
    expect(attachments[0]?.["contentType"]).toBe("text/calendar; method=REQUEST");
  });

  test("should include base64-encoded ICS content with event details", async () => {
    await sendManageLink(baseParams);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    const attachments = callArgs["attachments"] as ReadonlyArray<Record<string, unknown>>;
    const content = attachments[0]?.["content"] as string;

    // Decode base64 and verify ICS content
    const decoded = Buffer.from(content, "base64").toString("utf-8");
    expect(decoded).toContain("BEGIN:VCALENDAR");
    expect(decoded).toContain("END:VCALENDAR");
    expect(decoded).toContain("Birthday Celebration");
    expect(decoded).toContain("123 Party Lane");
    expect(decoded).toContain("METHOD:REQUEST");
  });

  test("should include calendar invite note in email HTML body", async () => {
    await sendManageLink(baseParams);

    const callArgs = mockSend.mock.calls[0]?.[0] as Record<string, unknown>;
    const html = callArgs["html"] as string;
    expect(html).toContain("A calendar invite is attached to this email.");
  });
});
