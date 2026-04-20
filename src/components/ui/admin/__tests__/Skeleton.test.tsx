/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, TableSkeleton } from "../Skeleton";

describe("Skeleton", () => {
  test("should render an aria-hidden placeholder element", () => {
    // when
    const { container } = render(<Skeleton data-testid="x" />);

    // then
    const el = container.firstChild as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el?.getAttribute("aria-hidden")).toBe("true");
  });

  test("should accept width and height via style", () => {
    // when
    render(<Skeleton data-testid="s" style={{ width: 200, height: 16 }} />);

    // then
    const el = screen.getByTestId("s") as HTMLElement;
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("16px");
  });
});

describe("TableSkeleton", () => {
  test("should render the requested number of rows and columns", () => {
    // when
    render(<TableSkeleton rows={3} columns={4} />);

    // then
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(3);
    const cells = screen.getAllByRole("cell");
    expect(cells.length).toBe(12);
  });

  test("should default to a reasonable row count when not specified", () => {
    // when
    render(<TableSkeleton columns={2} />);

    // then
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(0);
  });
});
