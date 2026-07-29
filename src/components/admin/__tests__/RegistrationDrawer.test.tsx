/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RegistrationDrawer } from "../RegistrationDrawer";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl: every translator resolves a key to itself, so assertions
// read against canonical keys rather than a specific locale's copy.
const localeState = vi.hoisted(() => ({ value: "en" }));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => localeState.value,
}));

const mockReg: RegistrationOutput = {
  id: "reg-1",
  name: "John Doe",
  email: "john@example.com",
  stay: StayOption.SAT_SUN,
  accommodation: AccommodationOption.ANYWHERE,
  adultsCount: 2,
  childrenCount: 1,
  notes: null,
  stayStartDate: null,
  stayEndDate: null,
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
};

const noopHandlers = {
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onCancel: vi.fn(),
  onResendEmail: vi.fn(),
};

describe("RegistrationDrawer", () => {
  beforeEach(() => {
    localeState.value = "en";
  });

  it("should render nothing when no registration is selected", () => {
    // given / when
    const { container } = render(
      <RegistrationDrawer registration={null} {...noopHandlers} />,
    );

    // then
    expect(container.textContent).toBe("");
  });

  it("should show the admin-set range when the registration has one", () => {
    // given
    // - an arbitrary range that matches no predefined stay option
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };

    // when
    render(<RegistrationDrawer registration={customReg} {...noopHandlers} />);

    // then
    expect(screen.getByText("dateRange")).toBeDefined();
    // - formatted the same way as the other dates in the panel, not as raw ISO
    expect(screen.getByText("Jul 10, 2026 – Jul 13, 2026")).toBeDefined();
  });

  it("should mark the range as stay-derived when no custom range is set", () => {
    // given / when
    render(<RegistrationDrawer registration={mockReg} {...noopHandlers} />);

    // then
    // - the drawer must not imply a pinned range where there is none
    expect(screen.getByText("dateRangeDefault")).toBeDefined();
  });

  it("should show a single date when the range covers one day", () => {
    // given
    // - a day visit: arrival and departure on the same date
    const dayVisit: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-10",
    };

    // when
    render(<RegistrationDrawer registration={dayVisit} {...noopHandlers} />);

    // then
    // - a one-day range reads as a single date, not a repeated one
    expect(screen.getByText("Jul 10, 2026")).toBeDefined();
  });

  it("should format calendar and timestamp dates in the active locale", () => {
    localeState.value = "cs";
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-10",
    };

    render(<RegistrationDrawer registration={customReg} {...noopHandlers} />);

    expect(screen.getByText(new Date("2026-07-10T00:00:00.000Z").toLocaleDateString("cs", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    }))).toBeDefined();
    expect(screen.getByText(new Date(mockReg.createdAt).toLocaleString("cs", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }))).toBeDefined();
  });

  it("should keep showing the stay option alongside a custom range", () => {
    // given
    // - the stay option still drives tables, filters and exports
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };

    // when
    render(<RegistrationDrawer registration={customReg} {...noopHandlers} />);

    // then
    expect(screen.getByText("enums.stay.SAT_SUN")).toBeDefined();
  });

  it("should let Escape dismiss only the nested cancellation confirmation", () => {
    const onClose = vi.fn();
    render(
      <RegistrationDrawer
        registration={mockReg}
        {...noopHandlers}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.getByRole("dialog", { name: "confirmCancel" })).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "confirmCancel" })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: mockReg.name })).toBeDefined();
  });

  it("should contain Tab focus within the drawer", () => {
    render(<RegistrationDrawer registration={mockReg} {...noopHandlers} />);
    const dialog = screen.getByRole("dialog", { name: mockReg.name });
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();

    last?.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first?.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("should make the background inert and restore focus to the exact opener", () => {
    const opener = document.createElement("button");
    opener.textContent = "Open drawer";
    document.body.appendChild(opener);
    opener.focus();

    const { container, rerender } = render(
      <RegistrationDrawer registration={mockReg} {...noopHandlers} />,
    );
    expect(container.hasAttribute("inert")).toBe(true);
    expect(container.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("dialog", { name: mockReg.name }).contains(document.activeElement))
      .toBe(true);

    rerender(<RegistrationDrawer registration={null} {...noopHandlers} />);

    expect(container.hasAttribute("inert")).toBe(false);
    expect(container.hasAttribute("aria-hidden")).toBe(false);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
