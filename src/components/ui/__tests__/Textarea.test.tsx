/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "../Textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea aria-label="notes" />);
    expect(screen.getByLabelText("notes")).toBeDefined();
  });

  it("sets aria-invalid when error is provided", () => {
    render(<Textarea aria-label="notes" error="Too long" />);
    expect(screen.getByLabelText("notes").getAttribute("aria-invalid")).toBe("true");
  });
});
