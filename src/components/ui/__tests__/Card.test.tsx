/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello World</Card>);
    expect(screen.getByText("Hello World")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Card className="text-center">Content</Card>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("text-center");
    expect(div.className).toContain("border-2");
  });
});
