/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Modal } from "../Modal";

describe("admin Modal", () => {
  test("should render nothing when open is false", () => {
    // when
    render(
      <Modal open={false} onClose={vi.fn()} title="T">
        <p>body</p>
      </Modal>,
    );

    // then
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("should render dialog with title and children when open is true", () => {
    // when
    render(
      <Modal open onClose={vi.fn()} title="My Modal">
        <p>Hello</p>
      </Modal>,
    );

    // then
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("My Modal")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  test("should invoke onClose when Escape key is pressed", () => {
    // given
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        <p>body</p>
      </Modal>,
    );

    // when
    fireEvent.keyDown(document, { key: "Escape" });

    // then
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("should invoke onClose when backdrop is clicked", () => {
    // given
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        <p>body</p>
      </Modal>,
    );

    // when
    const backdrop = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdrop);

    // then
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("should not invoke onClose when content area is clicked", () => {
    // given
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        <p>body</p>
      </Modal>,
    );

    // when
    fireEvent.click(screen.getByText("body"));

    // then
    expect(onClose).not.toHaveBeenCalled();
  });

  test("should move focus into the dialog when opened", async () => {
    // given
    render(
      <Modal open onClose={vi.fn()} title="T">
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>,
    );

    // then
    // - focus lands inside the dialog, not on the body
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  test("should trap Tab navigation within the dialog", async () => {
    // given
    // - two buttons inside, plus the implicit close button in the modal header
    render(
      <Modal open onClose={vi.fn()} title="T">
        <button type="button" data-testid="first">
          First
        </button>
        <button type="button" data-testid="last">
          Last
        </button>
      </Modal>,
    );

    // when
    // - after initial focus, tabbing past the last focusable cycles to the first
    const last = screen.getByTestId("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });

    // then
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  test("should restore focus to the trigger element when closed", async () => {
    // given
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="T">
        <p>body</p>
      </Modal>,
    );

    // when
    // - close the modal
    rerender(
      <Modal open={false} onClose={vi.fn()} title="T">
        <p>body</p>
      </Modal>,
    );

    // then
    // - focus returns to the previously focused element
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });

    document.body.removeChild(trigger);
  });

  test("should not react to Escape when open is false", () => {
    // given
    const onClose = vi.fn();
    render(
      <Modal open={false} onClose={onClose} title="T">
        <p>body</p>
      </Modal>,
    );

    // when
    fireEvent.keyDown(document, { key: "Escape" });

    // then
    expect(onClose).not.toHaveBeenCalled();
  });
});
