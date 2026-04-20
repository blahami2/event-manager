/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsStrip } from "../StatsStrip";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("StatsStrip", () => {
  test("should render five stats with their numeric values when stats are provided", () => {
    // when
    render(
      <StatsStrip
        stats={{
          total: 10,
          confirmed: 8,
          cancelled: 2,
          totalAdults: 15,
          totalChildren: 3,
        }}
      />,
    );

    // then
    // - every numeric value appears exactly once
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  test("should render a skeleton placeholder for every stat when stats are null", () => {
    // when
    const { container } = render(<StatsStrip stats={null} />);

    // then
    // - five shimmering placeholders map 1:1 to the five stats shown when data loads
    const skeletons = container.querySelectorAll(".animate-skeleton");
    expect(skeletons.length).toBe(5);
  });
});
