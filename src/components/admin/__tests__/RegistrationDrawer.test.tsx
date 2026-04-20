/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationDrawer } from "../RegistrationDrawer";
import {
  AccommodationOption,
  RegistrationStatus,
  StayOption,
} from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const reg: RegistrationOutput = {
  id: "abc",
  name: "Alice Smith",
  email: "alice@example.com",
  stay: StayOption.SAT_SUN,
  accommodation: AccommodationOption.PRIVATE_ROOM,
  adultsCount: 2,
  childrenCount: 1,
  notes: "Window seat please",
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-15T10:20:00Z"),
  updatedAt: new Date("2026-02-01T11:05:00Z"),
};

describe("RegistrationDrawer", () => {
  test("should render nothing when registration is null", () => {
    // when
    render(
      <RegistrationDrawer
        registration={null}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onResendEmail={vi.fn()}
      />,
    );

    // then
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("should render full registration details when a registration is provided", () => {
    // when
    render(
      <RegistrationDrawer
        registration={reg}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onResendEmail={vi.fn()}
      />,
    );

    // then
    expect(screen.getByText("Alice Smith")).toBeDefined();
    expect(screen.getByText("alice@example.com")).toBeDefined();
    // - canonical enum labels
    expect(screen.getByText("enums.stay.SAT_SUN")).toBeDefined();
    expect(screen.getByText("enums.accommodation.PRIVATE_ROOM")).toBeDefined();
    // - notes body
    expect(screen.getByText("Window seat please")).toBeDefined();
    // - id shown in the metadata block
    expect(screen.getByText("abc")).toBeDefined();
  });

  test("should call onClose when Escape is pressed", () => {
    // given
    const onClose = vi.fn();
    render(
      <RegistrationDrawer
        registration={reg}
        onClose={onClose}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onResendEmail={vi.fn()}
      />,
    );

    // when
    fireEvent.keyDown(document, { key: "Escape" });

    // then
    expect(onClose).toHaveBeenCalled();
  });

  test("should call onEdit when the edit button is clicked", () => {
    // given
    const onEdit = vi.fn();
    render(
      <RegistrationDrawer
        registration={reg}
        onClose={vi.fn()}
        onEdit={onEdit}
        onCancel={vi.fn()}
        onResendEmail={vi.fn()}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "edit" }));

    // then
    expect(onEdit).toHaveBeenCalledWith(reg);
  });

  test("should not render cancel / resend buttons for a cancelled registration", () => {
    // when
    render(
      <RegistrationDrawer
        registration={{ ...reg, status: RegistrationStatus.CANCELLED }}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onResendEmail={vi.fn()}
      />,
    );

    // then
    expect(screen.getByRole("button", { name: "edit" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "cancel" })).toBeNull();
    expect(screen.queryByRole("button", { name: "resendEmail" })).toBeNull();
  });
});
