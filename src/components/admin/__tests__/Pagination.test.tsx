/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
    const showingText = screen.getByText(/Showing/);
    expect(showingText).toBeDefined();
    expect(showingText.textContent).toContain("1");
    expect(showingText.textContent).toContain("20");
    expect(showingText.textContent).toContain("50");
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
  });

  it("disables Previous on first page", () => {
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    const prev = screen.getByText("Previous") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it("disables Next on last page", () => {
    render(<Pagination page={3} pageSize={20} total={50} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    const next = screen.getByText("Next") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("calls onPageChange when Next is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when Previous is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={20} total={50} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Previous"));
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
