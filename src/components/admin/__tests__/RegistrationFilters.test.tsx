/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationFilters } from "../RegistrationFilters";

/**
 * Mocked translator. Returns the key verbatim, but for a couple of keys
 * that accept ICU parameters we substitute a template the test can
 * recognise — this exercises the real chip label wiring.
 */
const TEMPLATES: Record<string, string> = {
  filtersActiveSearch: "Search: {query}",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const template = TEMPLATES[key] ?? key;
    if (!values) return template;
    return Object.entries(values).reduce(
      (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
      template,
    );
  },
}));

describe("RegistrationFilters", () => {
  const defaultProps = {
    status: "",
    search: "",
    stay: "",
    accommodation: "",
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
    onStayChange: vi.fn(),
    onAccommodationChange: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("should render status, stay, accommodation, and search controls when mounted", () => {
    render(<RegistrationFilters {...defaultProps} />);
    expect(screen.getByLabelText("statusLabel")).toBeDefined();
    expect(screen.getByLabelText("filtersApplyStay")).toBeDefined();
    expect(screen.getByLabelText("filtersApplyAccommodation")).toBeDefined();
    expect(screen.getByPlaceholderText("searchPlaceholder")).toBeDefined();
  });

  it("should call onStatusChange when status selection changes", () => {
    const onStatusChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.change(screen.getByLabelText("statusLabel"), {
      target: { value: "CONFIRMED" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("CONFIRMED");
  });

  it("should call onStayChange when stay selection changes", () => {
    const onStayChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onStayChange={onStayChange} />);
    fireEvent.change(screen.getByLabelText("filtersApplyStay"), {
      target: { value: "SAT_SUN" },
    });
    expect(onStayChange).toHaveBeenCalledWith("SAT_SUN");
  });

  it("should call onAccommodationChange when accommodation selection changes", () => {
    const onAccommodationChange = vi.fn();
    render(<RegistrationFilters {...defaultProps} onAccommodationChange={onAccommodationChange} />);
    fireEvent.change(screen.getByLabelText("filtersApplyAccommodation"), {
      target: { value: "ANYWHERE" },
    });
    expect(onAccommodationChange).toHaveBeenCalledWith("ANYWHERE");
  });

  it("should render a Clear all button when at least one filter is active", () => {
    render(
      <RegistrationFilters
        {...defaultProps}
        status="CONFIRMED"
      />,
    );
    expect(screen.getByRole("button", { name: "clearFilters" })).toBeDefined();
  });

  it("should not render a Clear all button when no filters are active", () => {
    render(<RegistrationFilters {...defaultProps} />);
    expect(screen.queryByRole("button", { name: "clearFilters" })).toBeNull();
  });

  it("should call onClearAll when Clear all is clicked", () => {
    const onClearAll = vi.fn();
    render(
      <RegistrationFilters
        {...defaultProps}
        status="CONFIRMED"
        search="alice"
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "clearFilters" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("should show an active search chip that removes the search term when clicked", () => {
    const onSearchChange = vi.fn();
    render(
      <RegistrationFilters
        {...defaultProps}
        search="alice"
        onSearchChange={onSearchChange}
      />,
    );
    // - the chip includes the search query
    const chip = screen.getByRole("button", { name: /alice/ });
    fireEvent.click(chip);
    // - clicking the chip clears just that filter
    expect(onSearchChange).toHaveBeenCalledWith("");
  });
});
