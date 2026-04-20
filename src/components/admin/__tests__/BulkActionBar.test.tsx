/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkActionBar } from "../BulkActionBar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (!values) return key;
    return Object.entries(values).reduce(
      (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
      key === "selectedCount" ? "{count} selected" : key,
    );
  },
}));

describe("BulkActionBar", () => {
  test("should render nothing when selectedCount is 0", () => {
    // when
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        onExport={vi.fn()}
        onResendEmails={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    // then
    expect(container.innerHTML).toBe("");
  });

  test("should render the count and three actions when at least one row is selected", () => {
    // when
    render(
      <BulkActionBar
        selectedCount={3}
        onExport={vi.fn()}
        onResendEmails={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    // then
    expect(screen.getByText("3 selected")).toBeDefined();
    expect(screen.getByRole("button", { name: "bulkExport" })).toBeDefined();
    expect(screen.getByRole("button", { name: "bulkResend" })).toBeDefined();
    expect(screen.getByRole("button", { name: "clearSelection" })).toBeDefined();
  });

  test("should call onExport when the Export button is clicked", () => {
    // given
    const onExport = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onExport={onExport}
        onResendEmails={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "bulkExport" }));

    // then
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  test("should call onResendEmails when the Resend button is clicked", () => {
    // given
    const onResendEmails = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onExport={vi.fn()}
        onResendEmails={onResendEmails}
        onClear={vi.fn()}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "bulkResend" }));

    // then
    expect(onResendEmails).toHaveBeenCalledTimes(1);
  });

  test("should call onClear when the Clear button is clicked", () => {
    // given
    const onClear = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onExport={vi.fn()}
        onResendEmails={vi.fn()}
        onClear={onClear}
      />,
    );

    // when
    fireEvent.click(screen.getByRole("button", { name: "clearSelection" }));

    // then
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
