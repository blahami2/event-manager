/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("admin Badge", () => {
  test("should render children when provided", () => {
    // when
    render(<Badge>Hello</Badge>);

    // then
    expect(screen.getByText("Hello")).toBeDefined();
  });

  test("should expose the chosen variant via data-variant", () => {
    // given
    // - rendering a badge per variant to verify the marker
    const { rerender } = render(<Badge variant="success">S</Badge>);
    const success = screen.getByText("S").getAttribute("data-variant");
    rerender(<Badge variant="warning">W</Badge>);
    const warning = screen.getByText("W").getAttribute("data-variant");
    rerender(<Badge variant="danger">D</Badge>);
    const danger = screen.getByText("D").getAttribute("data-variant");
    rerender(<Badge variant="neutral">N</Badge>);
    const neutral = screen.getByText("N").getAttribute("data-variant");

    // then
    expect(success).toBe("success");
    expect(warning).toBe("warning");
    expect(danger).toBe("danger");
    expect(neutral).toBe("neutral");
  });

  test("should default to neutral variant when variant is not provided", () => {
    // when
    render(<Badge>X</Badge>);

    // then
    expect(screen.getByText("X").getAttribute("data-variant")).toBe("neutral");
  });
});
