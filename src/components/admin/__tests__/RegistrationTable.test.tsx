/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationTable } from "../RegistrationTable";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl: passthrough keys so we can assert on canonical enum keys
// such as `enums.stay.FRI_SUN`.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
    id: "reg-1",
    name: "John Doe",
    email: "john@example.com",
    stay: StayOption.FRI_SUN,
    accommodation: AccommodationOption.ANYWHERE,
    adultsCount: 2,
    childrenCount: 0,
    notes: null,
    status: RegistrationStatus.CONFIRMED,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    ...overrides,
  };
}

describe("RegistrationTable", () => {
  const defaultProps = {
    registrations: [makeRegistration()],
    onEdit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("should render empty state when no registrations", () => {
    render(<RegistrationTable registrations={[]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("noResults")).toBeDefined();
  });

  it("should render table headers when registrations exist", () => {
    render(<RegistrationTable {...defaultProps} />);
    // Name column now stacks name + email, so there's no dedicated email header.
    expect(screen.getByText("name")).toBeDefined();
    expect(screen.getByText("stay")).toBeDefined();
    expect(screen.getByText("adults")).toBeDefined();
    expect(screen.getByText("children")).toBeDefined();
    expect(screen.getByText("notes")).toBeDefined();
    expect(screen.getByText("status")).toBeDefined();
    expect(screen.getByText("created")).toBeDefined();
    expect(screen.getByText("actions")).toBeDefined();
  });

  it("should render registration data resolved via canonical enum labels", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    // - stay/accommodation/status resolve to enums.* keys (the canonical
    //   labels routed through the single `i18n/labels.ts` module).
    expect(screen.getByText("enums.stay.FRI_SUN")).toBeDefined();
    expect(screen.getByText("enums.accommodation.ANYWHERE")).toBeDefined();
    expect(screen.getByText("enums.status.CONFIRMED")).toBeDefined();
    // - adults count rendered
    expect(screen.getByText("2")).toBeDefined();
  });

  it("should show edit, cancel, and resend buttons for confirmed registration", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByRole("button", { name: "edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "cancel" })).toBeDefined();
    expect(screen.getByRole("button", { name: "resendEmail" })).toBeDefined();
  });

  it("should hide cancel and resend buttons for cancelled registration", () => {
    const cancelled = makeRegistration({ status: RegistrationStatus.CANCELLED });
    render(<RegistrationTable registrations={[cancelled]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "edit" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "cancel" })).toBeNull();
    expect(screen.queryByRole("button", { name: "resendEmail" })).toBeNull();
  });

  it("should call onEdit when edit is clicked", () => {
    const onEdit = vi.fn();
    const reg = makeRegistration();
    render(<RegistrationTable registrations={[reg]} onEdit={onEdit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(onEdit).toHaveBeenCalledWith(reg);
  });

  it("should show confirmation dialog when cancel is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    // - the dialog is mounted and its message appears (may appear more than
    //   once if the dialog uses the same string for title and body)
    expect(screen.getAllByText("confirmCancel").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "yes" })).toBeDefined();
    expect(screen.getByRole("button", { name: "no" })).toBeDefined();
  });

  it("should call onCancel when confirmation is accepted", () => {
    const onCancel = vi.fn();
    render(<RegistrationTable {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "yes" }));
    expect(onCancel).toHaveBeenCalledWith("reg-1");
  });

  it("should dismiss confirmation when no is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "no" }));
    expect(screen.queryByText("confirmCancel")).toBeNull();
  });

  it("should display the expand affordance for any non-empty note", () => {
    // given
    const regWithNotes = makeRegistration({ notes: "Vegetarian diet" });

    // when
    render(<RegistrationTable registrations={[regWithNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then — rows are kept the same compact height; the full note is
    // always behind an expand toggle, even for short notes, so every row
    // renders at identical height until the user asks otherwise.
    expect(screen.getByText("Vegetarian diet")).toBeDefined();
    expect(screen.getByText("notesExpand")).toBeDefined();
  });

  it("should expand long notes when the expand button is clicked", () => {
    // given
    // - a note longer than the preview threshold
    const longNote = "A".repeat(200);
    const regWithLongNote = makeRegistration({ notes: longNote });

    // when
    render(<RegistrationTable registrations={[regWithLongNote]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    // - expand button visible
    const expandBtn = screen.getByRole("button", { name: "notesExpand" });
    fireEvent.click(expandBtn);

    // then
    // - collapse label now visible
    expect(screen.getByRole("button", { name: "notesCollapse" })).toBeDefined();
    // - the full note is rendered somewhere
    expect(screen.getByText(longNote)).toBeDefined();
  });

  it("should display em-dash when registration has null notes", () => {
    // given
    // - a registration with null notes
    const regWithoutNotes = makeRegistration({ notes: null });

    // when
    render(<RegistrationTable registrations={[regWithoutNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    const cells = screen.getAllByRole("cell");
    const notesCell = cells.find((cell) => cell.textContent === "\u2014");
    expect(notesCell).toBeDefined();
  });
});
