/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationTable } from "../RegistrationTable";
import { RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
    id: "reg-1",
    name: "John Doe",
    email: "john@example.com",
    stay: StayOption.FRI_SUN,
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

  it("should render table headers including notes when registrations exist", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("name")).toBeDefined();
    expect(screen.getByText("email")).toBeDefined();
    expect(screen.getByText("stay")).toBeDefined();
    expect(screen.getByText("adults")).toBeDefined();
    expect(screen.getByText("children")).toBeDefined();
    expect(screen.getByText("notes")).toBeDefined();
    expect(screen.getByText("status")).toBeDefined();
    expect(screen.getByText("created")).toBeDefined();
    expect(screen.getByText("actions")).toBeDefined();
  });

  it("should render registration data when registrations provided", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    expect(screen.getByText("Fri–Sun")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("CONFIRMED")).toBeDefined();
  });

  it("should show edit and cancel buttons for confirmed registration", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("edit")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("should hide cancel button for cancelled registration", () => {
    const cancelled = makeRegistration({ status: RegistrationStatus.CANCELLED });
    render(<RegistrationTable registrations={[cancelled]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("edit")).toBeDefined();
    expect(screen.queryByText("cancel")).toBeNull();
  });

  it("should call onEdit when edit is clicked", () => {
    const onEdit = vi.fn();
    const reg = makeRegistration();
    render(<RegistrationTable registrations={[reg]} onEdit={onEdit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("edit"));
    expect(onEdit).toHaveBeenCalledWith(reg);
  });

  it("should show confirmation dialog when cancel is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.getByText("confirmCancel")).toBeDefined();
    expect(screen.getByText("yes")).toBeDefined();
    expect(screen.getByText("no")).toBeDefined();
  });

  it("should call onCancel when confirmation is accepted", () => {
    const onCancel = vi.fn();
    render(<RegistrationTable {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("cancel"));
    fireEvent.click(screen.getByText("yes"));
    expect(onCancel).toHaveBeenCalledWith("reg-1");
  });

  it("should dismiss confirmation when no is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByText("cancel"));
    fireEvent.click(screen.getByText("no"));
    expect(screen.queryByText("confirmCancel")).toBeNull();
  });

  it("should display notes text when registration has notes", () => {
    // given
    // - a registration with notes content
    const regWithNotes = makeRegistration({ notes: "Vegetarian diet, arriving late" });

    // when
    render(<RegistrationTable registrations={[regWithNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    expect(screen.getByText("Vegetarian diet, arriving late")).toBeDefined();
  });

  it("should display empty cell when registration has null notes", () => {
    // given
    // - a registration with null notes
    const regWithoutNotes = makeRegistration({ notes: null });

    // when
    render(<RegistrationTable registrations={[regWithoutNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    // - the notes column header exists
    expect(screen.getByText("notes")).toBeDefined();
    // - no notes text is displayed in the data row (the cell should render a dash)
    const cells = screen.getAllByRole("cell");
    const notesCell = cells.find((cell) => cell.textContent === "\u2014");
    expect(notesCell).toBeDefined();
  });

  it("should render notes column for multiple registrations with mixed notes", () => {
    // given
    // - one registration with notes and one without
    const registrations = [
      makeRegistration({ id: "reg-1", notes: "Has allergies" }),
      makeRegistration({ id: "reg-2", notes: null, name: "Jane Doe", email: "jane@example.com" }),
    ];

    // when
    render(<RegistrationTable registrations={registrations} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    expect(screen.getByText("Has allergies")).toBeDefined();
    const cells = screen.getAllByRole("cell");
    const dashCells = cells.filter((cell) => cell.textContent === "\u2014");
    expect(dashCells.length).toBeGreaterThanOrEqual(1);
  });
});
