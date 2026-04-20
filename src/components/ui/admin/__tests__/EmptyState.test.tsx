/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  test("should render title and description when provided", () => {
    // when
    render(<EmptyState title="Nothing here" description="Try adding one." />);

    // then
    expect(screen.getByText("Nothing here")).toBeDefined();
    expect(screen.getByText("Try adding one.")).toBeDefined();
  });

  test("should render the CTA element when action is provided", () => {
    // given
    const action = <button type="button">Create</button>;

    // when
    render(
      <EmptyState
        title="Empty"
        description="Add something."
        action={action}
      />,
    );

    // then
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();
  });
});
