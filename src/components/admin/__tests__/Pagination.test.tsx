/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

// Mock next-intl: return the requested key verbatim. Where the translator is
// called with values (e.g., `pageOfPages({ page, total })`), we render a
// predictable template so the test can assert the dynamic parts.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return Object.entries(values).reduce(
        (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
        key === "pageOfPages" ? "Page {page} of {total}" : key,
      );
    }
    return key;
  },
}));

describe("Pagination", () => {
  it("returns null when only one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={20} total={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders page info and navigation", () => {
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    // The aggregate paragraph contains every dynamic fragment.
    const paragraph = screen.getByText(/showing/);
    expect(paragraph.textContent).toContain("1");
    expect(paragraph.textContent).toContain("20");
    expect(paragraph.textContent).toContain("50");
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
  });

  it("disables Previous on first page", () => {
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    const prev = screen.getByRole("button", { name: "previous" }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it("disables Next on last page", () => {
    render(<Pagination page={3} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    const next = screen.getByRole("button", { name: "next" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("calls onPageChange when Next is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when Previous is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={20} total={50} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should render page size selector when multiple pages exist", () => {
    // given
    // - enough total items for multiple pages

    // when
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);

    // then
    const select = screen.getByLabelText("rowsPerPage") as HTMLSelectElement;
    expect(select).toBeDefined();
  });

  it("should call onPageSizeChange when page size selection changes", () => {
    // given
    const onPageSizeChange = vi.fn();

    // when
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={onPageSizeChange} />);
    fireEvent.change(screen.getByLabelText("rowsPerPage"), { target: { value: "50" } });

    // then
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
