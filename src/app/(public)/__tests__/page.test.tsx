/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IntlWrapper } from "@/test/intl-wrapper";
import HomePage from "../page";

describe("HomePage", () => {
  it("displays event name", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(screen.getByText("Triple threat")).toBeDefined();
  });

  it("displays event date", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(screen.getByText("Saturday, June 6, 2026")).toBeDefined();
  });

  it("displays event location", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(
      screen.getByText("Piesok, 900 01 Modra, Slovakia"),
    ).toBeDefined();
  });

  it("displays event description", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(
      screen.getByText("3 headliners / one event / a unique experience"),
    ).toBeDefined();
  });

  it("has a Register CTA linking to #rsvp", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    const links = screen.getAllByRole("link", { name: "Register" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.some((l) => l.getAttribute("href") === "#rsvp")).toBe(true);
  });

  it("has an Already registered link to /resend-link", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    const link = screen.getByRole("link", { name: "Already registered?" });
    expect(link.getAttribute("href")).toBe("/resend-link");
  });

  // Moved to page-server-component.test.ts (needs @vitest-environment node for fs access)
});
