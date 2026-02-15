/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "../LanguageSwitcher";

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("LanguageSwitcher", () => {
  it("should render language select with all locale options when mounted", async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByLabelText("Select language");
    expect(button).toBeDefined();

    // Open dropdown
    await userEvent.click(button);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]?.textContent).toContain("English");
    expect(options[1]?.textContent).toContain("Čeština");
    expect(options[2]?.textContent).toContain("Slovenčina");
  });

  it("should have current locale selected when mounted", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByLabelText("Select language");
    // Default locale is "en", button should show the English flag/label
    expect(button.textContent).toContain("🇬🇧");
  });
});
