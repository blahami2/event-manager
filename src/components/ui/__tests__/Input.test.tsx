/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input aria-label="test" />);
    expect(screen.getByLabelText("test")).toBeDefined();
  });

  it("sets aria-invalid when error is provided", () => {
    render(<Input aria-label="test" error="Bad" />);
    expect(screen.getByLabelText("test").getAttribute("aria-invalid")).toBe("true");
  });

  it("applies error border class", () => {
    render(<Input aria-label="test" error="Bad" />);
    expect(screen.getByLabelText("test").className).toContain("border-red-500");
  });
});
