/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CsIntlWrapper } from "@/test/intl-wrapper-cs";
import { REGISTRATION_DEADLINE } from "@/config/event";
import HomePage from "../page";

const CS_DEADLINE_DATE = REGISTRATION_DEADLINE.toLocaleDateString("cs", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const EN_US_DEADLINE_DATE = REGISTRATION_DEADLINE.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

describe("HomePage deadline date localization", () => {
  it("should display the details section deadline date in Czech locale when locale is cs", () => {
    // given
    // - the page is rendered with Czech locale
    render(<HomePage />, { wrapper: CsIntlWrapper });

    // when
    // - we look for the Czech-formatted deadline date in the details section
    const deadlineDateElements = screen.getAllByText(CS_DEADLINE_DATE);

    // then
    // - the Czech-formatted date should appear (details section + RSVP section)
    expect(deadlineDateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should not display the deadline date in hardcoded en-US format when locale is cs", () => {
    // given
    // - the page is rendered with Czech locale
    render(<HomePage />, { wrapper: CsIntlWrapper });

    // when
    // - we search for the en-US formatted deadline date
    const enUsElements = screen.queryAllByText(EN_US_DEADLINE_DATE);

    // then
    // - no element should show the en-US formatted date
    expect(enUsElements.length).toBe(0);
  });
});
