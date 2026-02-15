/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LanguageSwitcher } from "../LanguageSwitcher";

describe("LanguageSwitcher", () => {
  const reloadMock = vi.fn();

  beforeEach(() => {
    // Clear cookies
    document.cookie = "NEXT_LOCALE=; max-age=0; path=/";
    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, reload: reloadMock },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    reloadMock.mockClear();
  });

  it("should render the toggle button with current locale when defaulting to English", () => {
    // Given no NEXT_LOCALE cookie is set
    // When the component renders
    render(<LanguageSwitcher />);

    // Then the toggle button should show the English flag
    const button = screen.getByRole("button", { name: /language/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain("🇬🇧");
  });

  it("should show all three language options when dropdown is opened", () => {
    // Given the component is rendered
    render(<LanguageSwitcher />);

    // When the toggle button is clicked
    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    // Then all three language options should be visible
    expect(screen.getByText("English")).toBeDefined();
    expect(screen.getByText("Čeština")).toBeDefined();
    expect(screen.getByText("Slovenčina")).toBeDefined();
  });

  it("should set NEXT_LOCALE cookie and reload when selecting Czech", () => {
    // Given the dropdown is open
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    // When Czech is selected
    const csOption = screen.getByText("Čeština");
    fireEvent.click(csOption);

    // Then the NEXT_LOCALE cookie should be set to 'cs'
    expect(document.cookie).toContain("NEXT_LOCALE=cs");
    // And the page should reload
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("should set NEXT_LOCALE cookie and reload when selecting Slovak", () => {
    // Given the dropdown is open
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    // When Slovak is selected
    const skOption = screen.getByText("Slovenčina");
    fireEvent.click(skOption);

    // Then the NEXT_LOCALE cookie should be set to 'sk'
    expect(document.cookie).toContain("NEXT_LOCALE=sk");
    // And the page should reload
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("should display Czech flag when NEXT_LOCALE cookie is cs", () => {
    // Given the cookie is set to Czech
    document.cookie = "NEXT_LOCALE=cs; path=/";

    // When the component renders
    render(<LanguageSwitcher />);

    // Then the toggle button should show the Czech flag
    const button = screen.getByRole("button", { name: /language/i });
    expect(button.textContent).toContain("🇨🇿");
  });

  it("should close dropdown when clicking outside", () => {
    // Given the dropdown is open
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);
    expect(screen.getByText("English")).toBeDefined();

    // When clicking outside
    fireEvent.mouseDown(document.body);

    // Then the dropdown should close
    expect(screen.queryByText("English")).toBeNull();
  });

  it("should close dropdown after selecting a language", () => {
    // Given the dropdown is open
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    // When selecting English
    fireEvent.click(screen.getByText("English"));

    // Then cookie is set and reload called
    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("should have proper ARIA attributes for accessibility", () => {
    // Given the component is rendered
    render(<LanguageSwitcher />);

    // Then the button should have proper aria attributes
    const button = screen.getByRole("button", { name: /language/i });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-haspopup")).toBe("listbox");

    // When opened
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    // Then the listbox should exist
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();
  });
});
