/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationTable } from "../RegistrationTable";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
    id: "reg-1",
    name: "John Doe",
    email: "john@example.com",
    guestCount: 2,
    dietaryNotes: null,
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

  it("renders empty state when no registrations", () => {
    render(<RegistrationTable registrations={[]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("No registrations found.")).toBeDefined();
  });

  it("renders table headers", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Guests")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Created")).toBeDefined();
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("renders registration data", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("CONFIRMED")).toBeDefined();
  });

  it("shows Edit and Cancel buttons for confirmed registration", () => {
    render(<RegistrationTable {...defaultProps} />);
    expect(screen.getByText("Edit")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("hides Cancel button for cancelled registration", () => {
    const cancelled = makeRegistration({ status: RegistrationStatus.CANCELLED });
    render(<RegistrationTable registrations={[cancelled]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Edit")).toBeDefined();
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("calls onEdit when Edit is clicked", () => {
    const onEdit = vi.fn();
    const reg = makeRegistration();
    render(<RegistrationTable registrations={[reg]} onEdit={onEdit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(reg);
  });

  it("shows confirmation dialog when Cancel is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Cancel this registration?")).toBeDefined();
    expect(screen.getByText("Yes")).toBeDefined();
    expect(screen.getByText("No")).toBeDefined();
  });

  it("calls onCancel when confirmation is accepted", () => {
    const onCancel = vi.fn();
    render(<RegistrationTable {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes"));
    expect(onCancel).toHaveBeenCalledWith("reg-1");
  });

  it("dismisses confirmation when No is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("No"));
    expect(screen.queryByText("Cancel this registration?")).toBeNull();
  });
});
