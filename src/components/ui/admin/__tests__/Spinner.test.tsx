/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("admin Spinner", () => {
  test("should announce busy state via role='status'", () => {
    // when
    render(<Spinner />);

    // then
    expect(screen.getByRole("status")).toBeDefined();
  });

  test("should render size marker sm", () => {
    // when
    render(<Spinner size="sm" />);

    // then
    expect(screen.getByRole("status").getAttribute("data-size")).toBe("sm");
  });

  test("should render size marker md", () => {
    // when
    render(<Spinner size="md" />);

    // then
    expect(screen.getByRole("status").getAttribute("data-size")).toBe("md");
  });

  test("should render visually-hidden label so screen readers announce context", () => {
    // when
    render(<Spinner label="Loading" />);

    // then
    expect(screen.getByText("Loading")).toBeDefined();
  });
});
