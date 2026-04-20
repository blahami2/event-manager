/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../Input";

describe("admin Input", () => {
  test("should render label text bound to the input via for/id", () => {
    // when
    render(<Input id="x" label="Name" />);

    // then
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    expect(input.id).toBe("x");
  });

  test("should mark input as invalid when error is provided", () => {
    // when
    render(<Input id="x" label="Email" error="Invalid" />);

    // then
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Invalid")).toBeDefined();
  });

  test("should render helper text when no error is present", () => {
    // when
    render(<Input id="x" label="Name" helperText="Enter first + last" />);

    // then
    expect(screen.getByText("Enter first + last")).toBeDefined();
  });

  test("should render the error instead of helper text when both are set", () => {
    // given
    render(
      <Input
        id="x"
        label="Name"
        helperText="Enter first + last"
        error="Too short"
      />,
    );

    // then
    // - error wins and is displayed
    expect(screen.getByText("Too short")).toBeDefined();
    // - helper text is suppressed to avoid conflicting messages
    expect(screen.queryByText("Enter first + last")).toBeNull();
  });

  test("should render a character counter when maxLength is set", () => {
    // when
    render(<Input id="x" label="Name" value="abc" readOnly maxLength={10} />);

    // then
    expect(screen.getByText("3 / 10")).toBeDefined();
  });

  test("should link aria-describedby to the error message id", () => {
    // when
    render(<Input id="x" label="Name" error="Too short" />);

    // then
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    // - the described-by element contains the error message
    if (!describedBy) throw new Error("describedBy should be set");
    const descEl = document.getElementById(describedBy);
    expect(descEl?.textContent).toContain("Too short");
  });
});
