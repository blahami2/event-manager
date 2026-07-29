/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistrationDrawer } from "../RegistrationDrawer";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl: every translator resolves a key to itself, so assertions
// read against canonical keys rather than a specific locale's copy.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
});
