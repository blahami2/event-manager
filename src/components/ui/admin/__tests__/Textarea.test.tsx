/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "../Textarea";

describe("admin Textarea", () => {
  test("should render label text bound to the textarea via for/id", () => {
    // when
    render(<Textarea id="n" label="Notes" />);

    // then
    const ta = screen.getByLabelText("Notes") as HTMLTextAreaElement;
    expect(ta.id).toBe("n");
    expect(ta.tagName).toBe("TEXTAREA");
  });

  test("should render the error message when error is provided", () => {
    // when
    render(<Textarea id="n" label="Notes" error="Too long" />);

    // then
    expect(screen.getByText("Too long")).toBeDefined();
    expect(
      screen.getByLabelText("Notes").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  test("should render a character counter when maxLength is set", () => {
    // when
    render(
      <Textarea id="n" label="Notes" value="hello" readOnly maxLength={100} />,
    );

    // then
    expect(screen.getByText("5 / 100")).toBeDefined();
  });

  test("should respect rows prop", () => {
    // when
    render(<Textarea id="n" label="Notes" rows={6} />);

    // then
    const ta = screen.getByLabelText("Notes") as HTMLTextAreaElement;
    expect(ta.rows).toBe(6);
  });
});
