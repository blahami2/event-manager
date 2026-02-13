/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditRegistrationModal } from "../EditRegistrationModal";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

const mockReg: RegistrationOutput = {
  id: "reg-1",
  name: "John Doe",
  email: "john@example.com",
  guestCount: 2,
  dietaryNotes: "Vegan",
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

describe("EditRegistrationModal", () => {
  it("renders with pre-filled values", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("John Doe");
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("john@example.com");
    expect((screen.getByLabelText("Guest Count") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("Dietary Notes") as HTMLTextAreaElement).value).toBe("Vegan");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with updated data on submit", () => {
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Guest Count"), { target: { value: "3" } });
    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    expect(onSave).toHaveBeenCalledWith("reg-1", {
      name: "Jane Doe",
      email: "john@example.com",
      guestCount: 3,
      dietaryNotes: "Vegan",
    });
  });

  it("renders dialog with accessible role", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
