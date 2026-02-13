import { describe, test, expect } from "vitest";
import { renderManageLinkEmail } from "@/lib/email/templates/manage-link-template";

describe("renderManageLinkEmail", () => {
  const defaultParams = {
    guestName: "Alice Johnson",
    eventName: "Birthday Celebration",
    eventDate: "March 15, 2026",
    manageUrl: "https://example.com/manage?token=abc123",
  } as const;

  test("should return a string containing valid HTML structure", () => {
    // given
    // - default params

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  test("should contain guest name in output HTML", () => {
    // given
    // - default params with guestName "Alice Johnson"

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Alice Johnson");
  });

  test("should contain event name in output HTML", () => {
    // given
    // - default params with eventName "Birthday Celebration"

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Birthday Celebration");
  });

  test("should contain event date in output HTML", () => {
    // given
    // - default params with eventDate "March 15, 2026"

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("March 15, 2026");
  });

  test("should contain manage URL as a clickable anchor tag", () => {
    // given
    // - default params with manageUrl

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain(`<a href="https://example.com/manage?token=abc123"`);
  });

  test("should use inline styles for responsiveness", () => {
    // given
    // - default params

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("max-width");
    expect(html).toContain("style=");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<style");
  });

  test("should not contain raw template tokens in output", () => {
    // given
    // - default params

    // when
    const html = renderManageLinkEmail(defaultParams);

    // then
    expect(html).not.toMatch(/\{\{.*\}\}/);
    expect(html).not.toMatch(/\$\{.*\}/);
    expect(html).not.toContain("{{guestName}}");
    expect(html).not.toContain("{{eventName}}");
    expect(html).not.toContain("{{eventDate}}");
    expect(html).not.toContain("{{manageUrl}}");
  });

  test("should escape HTML characters in guest name to prevent XSS", () => {
    // given
    // - a guest name with HTML special characters
    const params = {
      ...defaultParams,
      guestName: '<script>alert("xss")</script>',
    };

    // when
    const html = renderManageLinkEmail(params);

    // then
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("should escape HTML characters in event name", () => {
    // given
    // - an event name with HTML special characters
    const params = {
      ...defaultParams,
      eventName: 'Party & "Fun" <Night>',
    };

    // when
    const html = renderManageLinkEmail(params);

    // then
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).not.toContain('"Fun"');
  });

  test("should render all parameters together in a single output", () => {
    // given
    const params = {
      guestName: "Bob Smith",
      eventName: "Summer Gala",
      eventDate: "July 4, 2026",
      manageUrl: "https://events.example.com/manage?token=xyz789",
    };

    // when
    const html = renderManageLinkEmail(params);

    // then
    expect(html).toContain("Bob Smith");
    expect(html).toContain("Summer Gala");
    expect(html).toContain("July 4, 2026");
    expect(html).toContain(`<a href="https://events.example.com/manage?token=xyz789"`);
  });
});
