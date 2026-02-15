/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationFilters } from "../RegistrationFilters";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("RegistrationFilters", () => {
  const defaultProps = {
    status: "",
    search: "",
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
  };

  it("should render status filter with all options when component mounts", () => {
    render(<RegistrationFilters {...defaultProps} />);
    const select = screen.getByLabelText("statusLabel") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.options).toHaveLength(3);
    expect(select.options[0]?.textContent).toBe("all");
    expect(select.options[1]?.textContent).toBe("confirmed");
    expect(select.options[2]?.textContent).toBe("cancelled");
  });

  it("should render search input when component mounts", () => {
    render(<RegistrationFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText("searchPlaceholder")).toBeDefined();
  });

  it("should call onStatusChange when status changes", () => {
    const onStatusChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.change(screen.getByLabelText("statusLabel"), { target: { value: "CONFIRMED" } });
    expect(onStatusChange).toHaveBeenCalledWith("CONFIRMED");
  });

  it("should call onSearchChange when search input changes", () => {
    const onSearchChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), { target: { value: "john" } });
    expect(onSearchChange).toHaveBeenCalledWith("john");
  });

  it("should reflect current status value when status provided", () => {
    render(<RegistrationFilters {...defaultProps} status="CANCELLED" />);
    const select = screen.getByLabelText("statusLabel") as HTMLSelectElement;
    expect(select.value).toBe("CANCELLED");
  });

  it("should reflect current search value when search provided", () => {
    render(<RegistrationFilters {...defaultProps} search="test" />);
    const input = screen.getByPlaceholderText("searchPlaceholder") as HTMLInputElement;
    expect(input.value).toBe("test");
  });
});
