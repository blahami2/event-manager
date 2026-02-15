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
    expect(screen.getByText("Birthday Celebration")).toBeDefined();
  });

  it("displays event date", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(screen.getByText("Saturday, March 28, 2026")).toBeDefined();
  });

  it("displays event location", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(
      screen.getByText("123 Party Lane, Prague, Czech Republic"),
    ).toBeDefined();
  });

  it("displays event description", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    expect(
      screen.getByText(
        "Join us for an unforgettable birthday celebration! Great food, music, and company await.",
      ),
    ).toBeDefined();
  });

  it("has a Register CTA linking to /register", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    const links = screen.getAllByRole("link", { name: "Register" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.every((l) => l.getAttribute("href") === "/register")).toBe(true);
  });

  it("has an Already registered link to /resend-link", () => {
    render(<HomePage />, { wrapper: IntlWrapper });
    const link = screen.getByRole("link", { name: "Already registered?" });
    expect(link.getAttribute("href")).toBe("/resend-link");
  });

  it("is a Server Component (no use client directive)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/app/(public)/page.tsx",
      "utf-8",
    );
    expect(content).not.toContain("use client");
  });

  it("uses no inline styles", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/app/(public)/page.tsx",
      "utf-8",
    );
    expect(content).not.toContain("style=");
    expect(content).not.toContain("style:");
  });
});
