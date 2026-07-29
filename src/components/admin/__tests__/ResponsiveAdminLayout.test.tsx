/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BulkActionBar } from "../BulkActionBar";
import { StatsStrip } from "../StatsStrip";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("responsive admin layout primitives", () => {
  it("stacks statistics at narrow widths and restores three columns on sm screens", () => {
    const { container } = render(<StatsStrip stats={null} />);
    const strip = container.firstElementChild;
    expect(strip?.className).toContain("grid-cols-1");
    expect(strip?.className).toContain("sm:grid-cols-3");
  });

  it("allows long localized bulk actions to wrap on narrow screens", () => {
    render(
      <BulkActionBar
        count={2}
        onClear={vi.fn()}
        onResend={vi.fn()}
        exportHref="/export"
      />,
    );
    const bar = screen.getByRole("region", { name: "region" });
    expect(bar.className).toContain("flex-wrap");
    expect(bar.className).toContain("sm:flex-nowrap");
    expect(screen.getByRole("link", { name: "export" }).getAttribute("href"))
      .toBe("/export");
  });
});
