/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "../StatsCard";

describe("StatsCard", () => {
  it("renders label and value", () => {
    render(<StatsCard label="Total Registrations" value={42} />);
    expect(screen.getByText("Total Registrations")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("renders with zero value", () => {
    render(<StatsCard label="Cancelled" value={0} />);
    expect(screen.getByText("0")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatsCard label="Test" value={5} className="custom-class" />,
    );
    const card = container.firstElementChild;
    expect(card?.className).toContain("custom-class");
  });
});
