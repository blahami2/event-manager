/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../Select";

describe("admin Select", () => {
  test("should render label bound to select via for/id", () => {
    // when
    render(
      <Select id="s" label="Stay">
        <option value="A">A</option>
        <option value="B">B</option>
      </Select>,
    );

    // then
    const sel = screen.getByLabelText("Stay") as HTMLSelectElement;
    expect(sel.id).toBe("s");
    expect(sel.options).toHaveLength(2);
  });

  test("should call onChange when user picks a new option", () => {
    // given
    const onChange = vi.fn();
    render(
      <Select id="s" label="Stay" onChange={onChange}>
        <option value="A">A</option>
        <option value="B">B</option>
      </Select>,
    );

    // when
    fireEvent.change(screen.getByLabelText("Stay"), { target: { value: "B" } });

    // then
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("should render error message and flag aria-invalid when error is set", () => {
    // when
    render(
      <Select id="s" label="Stay" error="Required">
        <option value="">-</option>
      </Select>,
    );

    // then
    expect(screen.getByText("Required")).toBeDefined();
    expect(
      screen.getByLabelText("Stay").getAttribute("aria-invalid"),
    ).toBe("true");
  });
});
