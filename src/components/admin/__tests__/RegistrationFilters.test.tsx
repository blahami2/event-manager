/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationFilters } from "../RegistrationFilters";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const EMPTY = {
  status: "",
  stay: "",
  accommodation: "",
  search: "",
};

describe("RegistrationFilters", () => {
  it("renders all four controls", () => {
    render(
      <RegistrationFilters
        value={EMPTY}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText("searchPlaceholder")).toBeDefined();
    // Labels are sr-only; the control is findable by role.
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it("calls onChange when search input changes", () => {
    const onChange = vi.fn();
    render(
      <RegistrationFilters
        value={EMPTY}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "john" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "john" }),
    );
  });

  it("shows a clear button when any filter is active", () => {
    const onReset = vi.fn();
    render(
      <RegistrationFilters
        value={{ ...EMPTY, status: "CONFIRMED" }}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    );
    const clear = screen.getByRole("button", { name: "clear" });
    fireEvent.click(clear);
    expect(onReset).toHaveBeenCalled();
  });

  it("does not show a clear button when no filters are active", () => {
    render(
      <RegistrationFilters
        value={EMPTY}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "clear" })).toBeNull();
  });
});
