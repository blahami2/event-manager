import { describe, it, expect } from "vitest";
import {
  generateIcsEvent,
  escapeIcsText,
  foldLine,
  type IcsEventParams,
} from "@/lib/email/ics-generator";

const defaultParams: IcsEventParams = {
  eventName: "Birthday Party",
  eventDate: new Date("2026-03-15T18:00:00Z"),
  eventEndDate: new Date("2026-03-15T22:00:00Z"),
  eventLocation: "123 Main Street, Prague",
  eventDescription: "Join us for a celebration!",
  organizerEmail: "host@example.com",
};

describe("generateIcsEvent", () => {
  it("produces valid iCalendar structure with BEGIN/END tags", () => {
    const ics = generateIcsEvent(defaultParams);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes required calendar properties", () => {
    const ics = generateIcsEvent(defaultParams);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Event Manager//Event Calendar//EN");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("CALSCALE:GREGORIAN");
  });

  it("includes all event details", () => {
    const ics = generateIcsEvent(defaultParams);
    expect(ics).toContain("SUMMARY:Birthday Party");
    expect(ics).toContain("LOCATION:123 Main Street\\, Prague");
    expect(ics).toContain("DESCRIPTION:Join us for a celebration!");
    expect(ics).toContain("ORGANIZER:mailto:host@example.com");
    expect(ics).toContain("DTSTART:20260315T180000Z");
    expect(ics).toContain("DTEND:20260315T220000Z");
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("generates unique UIDs across invocations", () => {
    const ics1 = generateIcsEvent(defaultParams);
    const ics2 = generateIcsEvent(defaultParams);
    const uid1 = ics1.match(/UID:(.+)/)?.[1];
    const uid2 = ics2.match(/UID:(.+)/)?.[1];
    expect(uid1).toBeDefined();
    expect(uid2).toBeDefined();
    expect(uid1).not.toBe(uid2);
  });

  it("uses CRLF line endings", () => {
    const ics = generateIcsEvent(defaultParams);
    expect(ics).toContain("\r\n");
    // Should not have bare LF (except within CRLF)
    const withoutCrlf = ics.replace(/\r\n/g, "");
    expect(withoutCrlf).not.toContain("\n");
  });

  it("ends with CRLF", () => {
    const ics = generateIcsEvent(defaultParams);
    expect(ics.endsWith("\r\n")).toBe(true);
  });
});

describe("escapeIcsText", () => {
  it("escapes backslashes", () => {
    expect(escapeIcsText("path\\to")).toBe("path\\\\to");
  });

  it("escapes semicolons", () => {
    expect(escapeIcsText("a;b")).toBe("a\\;b");
  });

  it("escapes commas", () => {
    expect(escapeIcsText("a,b")).toBe("a\\,b");
  });

  it("escapes newlines", () => {
    expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
    expect(escapeIcsText("line1\r\nline2")).toBe("line1\\nline2");
  });

  it("handles multiple special characters together", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldLine", () => {
  it("does not fold short lines", () => {
    const short = "SUMMARY:Short";
    expect(foldLine(short)).toBe(short);
  });

  it("folds lines exceeding 75 octets", () => {
    const long = "DESCRIPTION:" + "A".repeat(100);
    const folded = foldLine(long);
    const parts = folded.split("\r\n ");
    // Each part should be at most 75 bytes
    const encoder = new TextEncoder();
    expect(encoder.encode(parts[0] ?? "").length).toBeLessThanOrEqual(75);
    for (let i = 1; i < parts.length; i++) {
      // continuation content + leading space = 75 max, so content <= 74
      expect(encoder.encode(parts[i] ?? "").length).toBeLessThanOrEqual(74);
    }
  });

  it("preserves original content after unfolding", () => {
    const long = "DESCRIPTION:" + "X".repeat(200);
    const folded = foldLine(long);
    const unfolded = folded.replace(/\r\n /g, "");
    expect(unfolded).toBe(long);
  });

  it("handles exactly 75 octet line without folding", () => {
    const exact = "X".repeat(75);
    expect(foldLine(exact)).toBe(exact);
  });
});
