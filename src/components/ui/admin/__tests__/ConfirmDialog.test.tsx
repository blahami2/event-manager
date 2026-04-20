/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

describe("admin ConfirmDialog", () => {
  test("should render title, message, confirm and dismiss buttons when open", () => {
    // when
    render(
      <ConfirmDialog
        open
        title="Cancel?"
        message="Are you sure?"
        confirmLabel="Yes"
        dismissLabel="No"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    // then
    expect(screen.getByText("Cancel?")).toBeDefined();
    expect(screen.getByText("Are you sure?")).toBeDefined();
    expect(screen.getByRole("button", { name: "Yes" })).toBeDefined();
    expect(screen.getByRole("button", { name: "No" })).toBeDefined();
  });

  test("should invoke onConfirm when confirm is clicked", () => {
    // given
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="T"
        message="m"
        confirmLabel="Yes"
        dismissLabel="No"
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    // then
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("should invoke onDismiss when dismiss is clicked", () => {
    // given
    const onDismiss = vi.fn();
    render(
      <ConfirmDialog
        open
        title="T"
        message="m"
        confirmLabel="Yes"
        dismissLabel="No"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "No" }));

    // then
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("should apply danger variant marker on the confirm button when variant is danger", () => {
    // when
    render(
      <ConfirmDialog
        open
        title="T"
        message="m"
        confirmLabel="Delete"
        dismissLabel="Keep"
        variant="danger"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    // then
    expect(
      screen
        .getByRole("button", { name: "Delete" })
        .getAttribute("data-variant"),
    ).toBe("danger");
  });
});
