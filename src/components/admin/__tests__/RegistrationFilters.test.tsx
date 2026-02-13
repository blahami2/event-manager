/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationFilters } from "../RegistrationFilters";

describe("RegistrationFilters", () => {
  const defaultProps = {
    status: "",
    search: "",
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
  };

  it("renders status filter with all options", () => {
    render(<RegistrationFilters {...defaultProps} />);
    const select = screen.getByLabelText("Filter by status") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.options).toHaveLength(3);
    expect(select.options[0]?.textContent).toBe("All");
    expect(select.options[1]?.textContent).toBe("Confirmed");
    expect(select.options[2]?.textContent).toBe("Cancelled");
  });

  it("renders search input", () => {
    render(<RegistrationFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search by name or email…")).toBeDefined();
  });

  it("calls onStatusChange when status changes", () => {
    const onStatusChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "CONFIRMED" } });
    expect(onStatusChange).toHaveBeenCalledWith("CONFIRMED");
  });

  it("calls onSearchChange when search input changes", () => {
    const onSearchChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText("Search by name or email…"), { target: { value: "john" } });
    expect(onSearchChange).toHaveBeenCalledWith("john");
  });

  it("reflects current status value", () => {
    render(<RegistrationFilters {...defaultProps} status="CANCELLED" />);
    const select = screen.getByLabelText("Filter by status") as HTMLSelectElement;
    expect(select.value).toBe("CANCELLED");
  });

  it("reflects current search value", () => {
    render(<RegistrationFilters {...defaultProps} search="test" />);
    const input = screen.getByPlaceholderText("Search by name or email…") as HTMLInputElement;
    expect(input.value).toBe("test");
  });
});
