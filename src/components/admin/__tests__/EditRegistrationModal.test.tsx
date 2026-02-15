/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditRegistrationModal } from "../EditRegistrationModal";
import { RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockReg: RegistrationOutput = {
  id: "reg-1",
  name: "John Doe",
  email: "john@example.com",
  stay: StayOption.FRI_SUN,
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegan",
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

describe("EditRegistrationModal", () => {
  it("should render with pre-filled values when registration provided", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe("John Doe");
    expect((screen.getByLabelText("email") as HTMLInputElement).value).toBe("john@example.com");
    expect((screen.getByLabelText("stay") as HTMLSelectElement).value).toBe("FRI_SUN");
    expect((screen.getByLabelText("adultsCount") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("childrenCount") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("notes") as HTMLTextAreaElement).value).toBe("Vegan");
  });

  it("should call onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onSave with updated data when form submitted", () => {
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("adultsCount"), { target: { value: "3" } });
    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    expect(onSave).toHaveBeenCalledWith("reg-1", {
      name: "Jane Doe",
      email: "john@example.com",
      stay: "FRI_SUN",
      adultsCount: 3,
      childrenCount: 1,
      notes: "Vegan",
    });
  });

  it("should render dialog with accessible role when mounted", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
