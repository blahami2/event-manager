/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "../LanguageSwitcher";

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("LanguageSwitcher", () => {
  it("should render language select with all locale options when mounted", () => {
    render(<LanguageSwitcher />);
    const select = screen.getByLabelText("Select language") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.options).toHaveLength(3);
    expect(select.options[0]?.textContent).toBe("EN");
    expect(select.options[1]?.textContent).toBe("CS");
    expect(select.options[2]?.textContent).toBe("SK");
  });

  it("should have current locale selected when mounted", () => {
    render(<LanguageSwitcher />);
    const select = screen.getByLabelText("Select language") as HTMLSelectElement;
    expect(select.value).toBe("en");
  });
});
